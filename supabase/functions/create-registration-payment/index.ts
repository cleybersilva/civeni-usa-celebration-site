import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const origin = req.headers.get("origin") || "https://wdkeqxfglmritghmakma.lovableproject.com";

    // Use a default test Stripe key if not set
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_51234567890";
    
    console.log("Stripe key check:", {
      exists: !!Deno.env.get("STRIPE_SECRET_KEY"),
      prefix: stripeKey.substring(0, 7)
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create a simple Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "brl",
          product_data: {
            name: "Inscrição CIVENI 2025",
            description: "Inscrição para o evento"
          },
          unit_amount: 7000, // R$ 70.00
        },
        quantity: 1,
      }],
      success_url: `${origin}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/registration-canceled`,
      customer_email: body.email || "test@example.com",
      metadata: {
        category_id: body.categoryId || "test",
        email: body.email || "test@example.com"
      },
    });

    console.log("Stripe session created:", session.id);
    console.log("Stripe URL:", session.url);

    return new Response(
      JSON.stringify({
        success: true,
        payment_required: true,
        url: session.url,
        session_id: session.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro: ${error.message}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});