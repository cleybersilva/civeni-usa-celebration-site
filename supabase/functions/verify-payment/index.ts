
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Persistent database-backed rate limiting
async function checkRateLimit(supabaseAdmin: any, ip: string, endpoint: string): Promise<{ allowed: boolean; error?: string; retryAfter?: number }> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_ip_address: ip,
      p_endpoint: endpoint,
      p_max_requests: 10,
      p_window_minutes: 1,
      p_block_minutes: 15
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Fail open to not block legitimate traffic
    }

    if (!data.allowed) {
      return { 
        allowed: false, 
        error: data.reason === 'blocked' ? 'IP temporarily blocked' : 'Rate limit exceeded',
        retryAfter: data.retry_after
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check exception:', error);
    return { allowed: true }; // Fail open
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Persistent database-backed rate limiting
  const clientIP = req.headers.get("x-forwarded-for")?.split(',')[0].trim() || 
                    req.headers.get("x-real-ip") || 
                    "unknown";
  
  const rateLimitCheck = await checkRateLimit(supabaseAdmin, clientIP, 'verify-payment');
  if (!rateLimitCheck.allowed) {
    return new Response(JSON.stringify({ 
      error: rateLimitCheck.error,
      retry_after: rateLimitCheck.retryAfter 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 429,
    });
  }

  try {
    const { session_id, registration_id } = await req.json();
    
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    // Verify registration_id matches if provided
    if (registration_id && session.metadata?.registration_id !== registration_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Registration ID mismatch', 
          payment_status: session.payment_status 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (session.payment_status === 'paid') {
      // Get registration details for email
      const { data: registration, error: regError } = await supabaseClient
        .from('event_registrations')
        .select('id, email, full_name, category_id')
        .eq('stripe_session_id', session_id)
        .single();

      if (regError) {
        console.error('Failed to fetch registration:', regError);
      }

      // Update registration status in event_registrations table
      const { error } = await supabaseClient
        .from('event_registrations')
        .update({ 
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session_id);

      if (error) {
        console.error('Database update error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to update payment status', 
            payment_status: session.payment_status 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Send confirmation email
      if (registration) {
        try {
          // Get category name
          const { data: category } = await supabaseClient
            .from('event_category')
            .select('title_pt')
            .eq('id', registration.category_id)
            .single();

          await supabaseClient.functions.invoke('send-registration-confirmation', {
            body: {
              email: registration.email,
              fullName: registration.full_name,
              registrationId: registration.id,
              categoryName: category?.title_pt || 'Categoria',
              isFree: false
            }
          });
          console.log('Confirmation email sent successfully');
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the request if email fails
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        payment_status: 'completed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      payment_status: session.payment_status 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ 
      error: "Erro ao verificar pagamento" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
