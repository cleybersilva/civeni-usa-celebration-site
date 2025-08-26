import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== FUNCTION CALLED ===");
    
    const body = await req.json();
    console.log("Request body:", body);

    // Test response - just return a test Stripe URL
    const testResponse = {
      success: true,
      payment_required: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_abc123",
      session_id: "cs_test_abc123",
      registration_id: "test-id"
    };

    console.log("Returning test response:", testResponse);

    return new Response(JSON.stringify(testResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});