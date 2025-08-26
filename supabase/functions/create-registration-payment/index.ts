import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  console.log("=== FUNCTION STARTED ===");
  console.log("Method:", req.method);
  
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== PARSING REQUEST ===");
    const body = await req.json();
    console.log("Request body:", body);

    const {
      email,
      fullName,
      categoryId,
      batchId,
      couponCode,
      cursoId,
      turmaId,
      participantType,
      currency = "BRL"
    } = body;

    console.log("=== CHECKING ENVIRONMENT ===");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("Environment check:", {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      stripeKey: !!stripeKey
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuração do Supabase inválida");
    }

    console.log("=== INITIALIZING SUPABASE ===");
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("=== FETCHING CATEGORY ===");
    const { data: category, error: categoryError } = await supabase
      .from("event_category")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (categoryError) {
      console.error("Category error:", categoryError);
      throw new Error("Categoria não encontrada: " + categoryError.message);
    }

    console.log("Category found:", category);

    // Create registration first
    console.log("=== CREATING REGISTRATION ===");
    const registrationData = {
      email,
      full_name: fullName,
      category_id: categoryId,
      batch_id: batchId,
      coupon_code: couponCode || null,
      curso_id: cursoId || null,
      turma_id: turmaId || null,
      participant_type: participantType,
      currency: currency,
      payment_status: category.is_free ? "completed" : "pending",
      amount_paid: category.is_free ? 0 : (category.price_cents / 100)
    };

    console.log("Registration data:", registrationData);

    const { data: registration, error: regError } = await supabase
      .from("event_registrations")
      .insert(registrationData)
      .select()
      .single();

    if (regError) {
      console.error("Registration error:", regError);
      throw new Error("Erro ao criar inscrição: " + regError.message);
    }

    console.log("Registration created:", registration.id);

    // If free category, return success
    if (category.is_free) {
      console.log("=== FREE REGISTRATION COMPLETED ===");
      return new Response(JSON.stringify({
        success: true,
        payment_required: false,
        registration_id: registration.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // For paid categories, create Stripe session
    console.log("=== CREATING STRIPE SESSION ===");
    
    if (!stripeKey) {
      throw new Error("Stripe não configurado");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    console.log("Stripe initialized, creating session...");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Inscrição - ${category.title_pt}`,
              description: "Inscrição para o evento CIVENI 2025",
            },
            unit_amount: category.price_cents,
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
      },
    });

    console.log("Stripe session created:", session.id);

    // Update registration with session ID
    await supabase
      .from("event_registrations")
      .update({ stripe_session_id: session.id })
      .eq("id", registration.id);

    console.log("=== SUCCESS - RETURNING URL ===");
    console.log("Stripe URL:", session.url);

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
    console.error("=== ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return new Response(JSON.stringify({
      error: error.message || "Erro interno do servidor",
      details: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});