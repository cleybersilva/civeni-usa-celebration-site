
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 registration attempts per minute per IP

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
    console.log("=== CREATE REGISTRATION PAYMENT START ===");
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const requestBody = await req.json();
    console.log("Request body:", requestBody);
    
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
    } = requestBody;

    console.log("Parsed data:", { email, fullName, categoryId, batchId, couponCode, currency });

    // Check required environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("Environment check:", {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      stripeKey: !!stripeKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuração do Supabase inválida");
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    );

    // Get category details from event_category table
    const { data: category, error: categoryError } = await supabaseClient
      .from("event_category")
      .select("*")
      .eq("id", categoryId)
      .single();

    if (categoryError || !category) {
      console.error("Category error:", categoryError);
      throw new Error("Categoria não encontrada");
    }

    console.log("Category found:", category);

    // Check if registration is free
    if (category.is_free) {
      // Create free registration directly in event_registrations table
      const { data: registration, error: regError } = await supabaseClient
        .from("event_registrations")
        .insert({
          email,
          full_name: fullName,
          category_id: categoryId,
          batch_id: batchId,
          coupon_code: couponCode || null,
          curso_id: cursoId || null,
          turma_id: turmaId || null,
          participant_type: participantType,
          payment_status: "completed",
          amount_paid: 0,
          currency: currency
        })
        .select()
        .single();

      if (regError) {
        console.error("Registration error:", regError);
        throw new Error("Erro ao criar inscrição: " + regError.message);
      }

      // Update coupon usage if coupon was provided
      if (couponCode) {
        const { error: couponUpdateError } = await supabaseClient
          .from("coupon_codes")
          .update({ used_count: supabaseClient.raw('used_count + 1') })
          .eq("code", couponCode);
        
        if (couponUpdateError) {
          console.error("Coupon update error:", couponUpdateError);
        }
      }

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

    // Use price from category (already in cents)
    let price = category.price_cents;
    if (!price || price <= 0) {
      throw new Error("Preço da categoria inválido");
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
        coupon_code: couponCode || null,
        curso_id: cursoId || null,
        turma_id: turmaId || null,
        participant_type: participantType,
        payment_status: "pending",
        amount_paid: price / 100, // Convert back to original amount
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
              name: `Inscrição VCCU - ${category.title_pt || 'Evento'}`,
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
