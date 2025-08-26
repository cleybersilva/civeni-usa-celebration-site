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
    console.log("Function called");
    
    const body = await req.json();
    console.log("Body:", body);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get category
    const { data: category } = await supabase
      .from('event_category')
      .select('*')
      .eq('id', body.categoryId)
      .single();

    console.log("Category:", category);

    // Create registration
    const { data: registration } = await supabase
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
        payment_status: category?.is_free ? 'completed' : 'pending',
        amount_paid: category?.is_free ? 0 : (category?.price_cents / 100)
      })
      .select()
      .single();

    console.log("Registration created:", registration?.id);

    if (category?.is_free) {
      return new Response(JSON.stringify({
        success: true,
        payment_required: false,
        registration_id: registration?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Stripe session
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Inscrição - ${category?.title_pt}`,
          },
          unit_amount: category?.price_cents || 1000,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/registration-canceled`,
      customer_email: body.email,
    });

    console.log("Stripe session created:", session.id);

    // Update registration with session ID
    await supabase
      .from('event_registrations')
      .update({ stripe_session_id: session.id })
      .eq('id', registration?.id);

    return new Response(JSON.stringify({
      success: true,
      payment_required: true,
      url: session.url,
      session_id: session.id,
      registration_id: registration?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});