import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("=== GETTING CATEGORY ===");
    
    // Get category
    const { data: category, error: categoryError } = await supabase
      .from('event_category')
      .select('*')
      .eq('id', body.categoryId)
      .single();

    if (categoryError) {
      console.error("Category error:", categoryError);
      throw new Error("Categoria não encontrada");
    }

    console.log("Category found:", category);

    console.log("=== CREATING REGISTRATION ===");

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert({
        email: body.email,
        full_name: body.fullName,
        category_id: body.categoryId,
        batch_id: body.batchId,
        coupon_code: body.couponCode || null,
        curso_id: body.cursoId || null,
        turma_id: body.turmaId || null,
        participant_type: body.participantType,
        currency: body.currency || 'BRL',
        payment_status: category.is_free ? 'completed' : 'pending',
        amount_paid: category.is_free ? 0 : (category.price_cents / 100)
      })
      .select()
      .single();

    if (regError) {
      console.error("Registration error:", regError);
      throw new Error("Erro ao criar inscrição: " + regError.message);
    }

    console.log("Registration created:", registration.id);

    // If free category, return success
    if (category.is_free) {
      console.log("=== FREE REGISTRATION ===");
      return new Response(JSON.stringify({
        success: true,
        payment_required: false,
        registration_id: registration.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("=== CREATING STRIPE SESSION ===");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${category.title_pt}`,
            description: 'Inscrição para o III CIVENI 2025'
          },
          unit_amount: category.price_cents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/registration-canceled`,
      customer_email: body.email,
      metadata: {
        registration_id: registration.id,
        category_id: body.categoryId,
      },
    });

    console.log("Stripe session created:", session.id);
    console.log("Stripe URL:", session.url);

    // Update registration with session ID
    await supabase
      .from('event_registrations')
      .update({ stripe_session_id: session.id })
      .eq('id', registration.id);

    console.log("=== SUCCESS ===");

    return new Response(JSON.stringify({
      success: true,
      payment_required: true,
      url: session.url,
      session_id: session.id,
      registration_id: registration.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});