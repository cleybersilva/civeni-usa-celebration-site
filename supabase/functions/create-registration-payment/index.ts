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
    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get('origin') || 'https://wdkeqxfglmritghmakma.lovableproject.com';

    // Ensure Stripe secret exists
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ success: false, error: 'STRIPE_SECRET_KEY ausente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Load category to get price_cents
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { categoryId, email } = body as { categoryId?: string; email?: string };
    if (!categoryId) {
      return new Response(JSON.stringify({ success: false, error: 'Categoria não informada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data: category, error: catErr } = await supabase
      .from('event_category')
      .select('title_pt, price_cents, currency, is_free')
      .eq('id', categoryId)
      .single();

    if (catErr || !category) {
      return new Response(JSON.stringify({ success: false, error: 'Categoria não encontrada' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (category.is_free) {
      return new Response(JSON.stringify({ success: true, payment_required: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Always use price_data - never stripe_price_id to avoid test/live conflicts
    const unitAmount = category.price_cents && category.price_cents > 0 ? category.price_cents : 7000; // Default R$ 70.00
    const currency = (category.currency || 'BRL').toLowerCase();
    
    const lineItem = {
      price_data: {
        currency,
        product_data: { 
          name: category.title_pt || 'Inscrição CIVENI 2025',
          description: 'Inscrição para o III CIVENI 2025'
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${origin}/registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/registration-canceled`,
      customer_email: email,
      metadata: {
        category_id: categoryId,
        email: email || 'no-email'
      }
    });

    if (!session?.url) {
      return new Response(JSON.stringify({ success: false, error: 'Stripe não retornou URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, payment_required: true, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Erro interno' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});