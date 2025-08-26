import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("=== FUNCTION CALLED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  if (req.method === 'OPTIONS') {
    console.log("Returning OPTIONS response");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== PARSING BODY ===");
    const body = await req.json();
    console.log("Body parsed successfully:", body);

    console.log("=== CHECKING ENV VARS ===");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    console.log("Environment variables:", {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      stripeKey: !!stripeKey
    });

    if (!stripeKey) {
      console.log("No Stripe key - returning error");
      return new Response(JSON.stringify({
        success: false,
        error: 'Stripe key not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("=== CREATING MINIMAL RESPONSE ===");
    
    const response = {
      success: true,
      payment_required: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_minimal",
      session_id: "cs_test_minimal",
      debug: {
        hasStripeKey: !!stripeKey,
        bodyReceived: !!body,
        email: body?.email || 'no email'
      }
    };

    console.log("Returning response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== CAUGHT ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Full error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Function error: ${error?.message || 'Unknown error'}`,
      errorType: typeof error,
      errorString: String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});