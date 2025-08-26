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
    console.log("=== FUNCTION STARTED ===");
    
    const body = await req.json();
    console.log("Body:", body);

    // Check Stripe key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    console.log("Stripe key exists:", !!stripeKey);
    console.log("Stripe key prefix:", stripeKey?.substring(0, 7));

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }

    // Initialize Stripe with explicit configuration
    console.log("=== INITIALIZING STRIPE ===");
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    console.log("Stripe initialized successfully");

    // Create simple Stripe session - bypassing Supabase for now
    console.log("=== CREATING STRIPE SESSION ===");
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Inscrição CIVENI 2025',
            description: 'Inscrição para o evento CIVENI 2025'
          },
          unit_amount: 7000, // R$ 70.00 fixo para teste
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/registration-success`,
      cancel_url: `${req.headers.get('origin')}/registration-canceled`,
      customer_email: body.email,
      metadata: {
        category_id: body.categoryId,
        email: body.email,
        full_name: body.fullName
      },
    });

    console.log("Stripe session created successfully:", session.id);
    console.log("Stripe URL:", session.url);

    // Now try to save to Supabase
    console.log("=== SAVING TO SUPABASE ===");
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
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
          currency: 'BRL',
          payment_status: 'pending',
          amount_paid: 70.00,
          stripe_session_id: session.id
        })
        .select()
        .single();

      if (regError) {
        console.error("Supabase error:", regError);
        // Continue even if Supabase fails - Stripe session is created
      } else {
        console.log("Registration saved:", registration?.id);
      }
    } catch (supabaseError) {
      console.error("Supabase error:", supabaseError);
      // Continue even if Supabase fails
    }

    console.log("=== RETURNING SUCCESS ===");

    return new Response(JSON.stringify({
      success: true,
      payment_required: true,
      url: session.url,
      session_id: session.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== STRIPE ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Erro Stripe: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});