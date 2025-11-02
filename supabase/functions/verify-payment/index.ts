
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = ip || 'unknown';
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  const limits = rateLimitMap.get(key)!;
  
  if (now > limits.resetTime) {
    // Reset the counter
    limits.count = 1;
    limits.resetTime = now + RATE_LIMIT_WINDOW;
    return true;
  }
  
  if (limits.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  limits.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Basic rate limiting
  const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(clientIP)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
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
