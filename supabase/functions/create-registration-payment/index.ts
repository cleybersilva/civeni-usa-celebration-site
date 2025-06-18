
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, categoryId, batchId, couponCode, currency = 'BRL' } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if email already registered
    const { data: existingRegistration } = await supabaseClient
      .from('event_registrations')
      .select('id')
      .eq('email', email)
      .single();

    if (existingRegistration) {
      throw new Error('Este email já está registrado para o evento');
    }

    // Get batch and category information
    const { data: batch } = await supabaseClient
      .from('registration_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    const { data: category } = await supabaseClient
      .from('registration_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (!batch || !category) {
      throw new Error('Batch ou categoria inválida');
    }

    let finalPrice = category.price_brl;
    let validCoupon = null;

    // Validate coupon if provided
    if (couponCode) {
      const { data: couponData } = await supabaseClient
        .rpc('validate_coupon', { coupon_code: couponCode });
      
      if (couponData && couponData.length > 0 && couponData[0].is_valid) {
        validCoupon = couponData[0];
        if (validCoupon.category_id === categoryId) {
          finalPrice = 0; // Exempt category
        }
      }
    }

    // Convert currency if needed
    let stripeAmount = Math.round(finalPrice * 100); // Convert to cents
    let stripeCurrency = 'brl';

    if (currency === 'USD') {
      // Simple conversion rate - in production, use real-time rates
      stripeAmount = Math.round((finalPrice / 5.5) * 100); // Approximate BRL to USD
      stripeCurrency = 'usd';
    }

    // If price is 0 (exempt), create registration directly
    if (finalPrice === 0) {
      const { data: registration } = await supabaseClient
        .from('event_registrations')
        .insert({
          email,
          full_name: fullName,
          category_id: categoryId,
          batch_id: batchId,
          payment_status: 'completed',
          amount_paid: 0,
          currency: stripeCurrency.toUpperCase(),
          coupon_code: couponCode
        })
        .select()
        .single();

      return new Response(JSON.stringify({ 
        success: true, 
        registration_id: registration.id,
        payment_required: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Stripe payment session
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: stripeCurrency,
            product_data: {
              name: `III Civeni USA 2025 - ${category.category_name}`,
              description: `Lote ${batch.batch_number} - Inscrição para o evento`,
            },
            unit_amount: stripeAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/registration-canceled`,
      metadata: {
        email,
        fullName,
        categoryId,
        batchId,
        couponCode: couponCode || '',
      },
    });

    // Create pending registration
    await supabaseClient
      .from('event_registrations')
      .insert({
        email,
        full_name: fullName,
        category_id: categoryId,
        batch_id: batchId,
        stripe_session_id: session.id,
        payment_status: 'pending',
        amount_paid: finalPrice,
        currency: stripeCurrency.toUpperCase(),
        coupon_code: couponCode
      });

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Erro interno do servidor" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
