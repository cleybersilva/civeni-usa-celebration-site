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
    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get("origin") || "https://wdkeqxfglmritghmakma.lovableproject.com";

    // Ensure Stripe secret
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // Return 200 to avoid supabase-js throwing network error, but indicate failure
      return new Response(
        JSON.stringify({ success: false, error: "Stripe não configurado (STRIPE_SECRET_KEY ausente)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { email, categoryId } = body as { email?: string; categoryId?: string };

    if (!categoryId) {
      return new Response(
        JSON.stringify({ success: false, error: "Categoria não informada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Load category
    const { data: category, error: catErr } = await supabase
      .from("event_category")
      .select("id, title_pt, price_cents, currency, is_free, stripe_price_id")
      .eq("id", categoryId)
      .single();

    if (catErr || !category) {
      return new Response(
        JSON.stringify({ success: false, error: "Categoria não encontrada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (category.is_free) {
      // No payment required
      return new Response(
        JSON.stringify({ success: true, payment_required: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create Stripe checkout session
    let lineItem: any;
    if (category.stripe_price_id) {
      lineItem = { price: category.stripe_price_id, quantity: 1 };
    } else {
      const unitAmount = category.price_cents && category.price_cents > 0 ? category.price_cents : 1000;
      const currency = (category.currency || "BRL").toLowerCase();
      lineItem = {
        price_data: {
          currency,
          product_data: { name: category.title_pt || "Inscrição" },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [lineItem],
      success_url: `${origin}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/registration-canceled`,
      customer_email: email,
      metadata: { category_id: categoryId },
    });

    if (!session?.url) {
      return new Response(
        JSON.stringify({ success: false, error: "Stripe não retornou URL de checkout" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, payment_required: true, url: session.url, session_id: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e: any) {
    // Always return 200 with success:false to avoid supabase-js network error masking
    return new Response(
      JSON.stringify({ success: false, error: e?.message || "Erro interno" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});