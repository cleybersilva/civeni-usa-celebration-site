
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://wdkeqxfglmritghmakma.lovableproject.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      email,
      fullName,
      categoryId,
      batchId,
      couponCode,
      cursoId,
      turmaId,
      participantType,
      registrationType,
      currency = "BRL"
    } = await req.json();

    console.log("Creating registration for:", { email, fullName, categoryId, batchId, couponCode, currency });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get category details
    const { data: category, error: categoryError } = await supabaseClient
      .from("registration_categories")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (categoryError || !category) {
      throw new Error("Categoria não encontrada");
    }

    console.log("Category found:", category);

    // Check if registration is free (exempt category)
    if (category.is_exempt) {
      // Validate coupon for exempt categories
      if (!couponCode) {
        throw new Error("Código de cupom é obrigatório para esta categoria");
      }

      const { data: couponValidation, error: couponError } = await supabaseClient
        .rpc('validate_coupon', { coupon_code: couponCode });

      if (couponError || !couponValidation || !couponValidation.is_valid) {
        throw new Error("Código de cupom inválido ou expirado");
      }

      // Create free registration directly in event_registrations table
      const { data: registration, error: regError } = await supabaseClient
        .from("event_registrations")
        .insert({
          email,
          full_name: fullName,
          category_id: categoryId,
          batch_id: batchId,
          coupon_code: couponCode,
          curso_id: cursoId,
          turma_id: turmaId,
          participant_type: participantType,
          payment_status: "completed",
          amount_paid: 0,
          currency: currency
        })
        .select()
        .single();

      if (regError) {
        console.error("Registration error:", regError);
        throw new Error("Erro ao criar inscrição");
      }

      // Update coupon usage
      await supabaseClient
        .from("coupon_codes")
        .update({ used_count: supabaseClient.raw('used_count + 1') })
        .eq("code", couponCode);

      console.log("Free registration created:", registration);

      return new Response(JSON.stringify({
        success: true,
        payment_required: false,
        registration_id: registration.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For paid categories, create Stripe checkout session
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Convert price based on currency
    let price = category.price_brl;
    if (currency === "USD") {
      price = Math.round(price / 5.5 * 100); // Convert BRL to USD cents
    } else {
      price = Math.round(price * 100); // Convert BRL to cents
    }

    console.log("Creating Stripe session with price:", price, currency);

    // Create registration record first
    const { data: registration, error: regError } = await supabaseClient
      .from("event_registrations")
      .insert({
        email,
        full_name: fullName,
        category_id: categoryId,
        batch_id: batchId,
        coupon_code: couponCode,
        curso_id: cursoId,
        turma_id: turmaId,
        participant_type: participantType,
        payment_status: "pending",
        amount_paid: price / 100,
        currency: currency
      })
      .select()
      .single();

    if (regError) {
      console.error("Registration error:", regError);
      throw new Error("Erro ao criar inscrição");
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Inscrição VCCU - ${category.category_name}`,
              description: `Inscrição para o evento VCCU/Civeni USA`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/registration-canceled`,
      customer_email: email,
      metadata: {
        registration_id: registration.id,
        category_id: categoryId,
        batch_id: batchId,
      },
    });

    // Update registration with Stripe session ID
    await supabaseClient
      .from("event_registrations")
      .update({ stripe_session_id: session.id })
      .eq("id", registration.id);

    console.log("Stripe session created:", session.id);

    return new Response(JSON.stringify({
      success: true,
      payment_required: true,
      url: session.url,
      session_id: session.id,
      registration_id: registration.id
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
