import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "*",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== FUNCTION STARTED ===");
    
    const body = await req.json();
    console.log("Body received:", body);

    // Return a direct Stripe test URL
    const stripeTestUrl = "https://checkout.stripe.com/c/pay/cs_test_a1nSqCqnNwRODKgm4qY1N1sD8h9j0rRrXjKqzPc4aF4gvP7yY2tQxW9vUzE6iK3M#fidkdWxOYHwnPyd1blpxYHZxWjA0VT1zQGNvZEdqa2pkT1ZnY0Y9X0gzVVB2RVNmNHU9T1hKUVE0cEhPVkpiRmlIR1JxZH1sV2QzfG01aDdMZVV8VkJnZkpqaENOVVE4ZG8xYGlsY2MnKSd2d2BjYHd3YGNgd3dgY2B3d2BjYGRpZGFgKSdocGxhZycp";

    console.log("Returning test Stripe URL");

    const response = {
      success: true,
      payment_required: true,
      url: stripeTestUrl,
      session_id: "cs_test_123",
      debug: true
    };

    console.log("Response:", response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});