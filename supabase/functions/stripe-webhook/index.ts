import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret || '');
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Webhook verified:', event.type);

    const occurred_at = new Date(event.created * 1000).toISOString();
    const type = event.type;
    const data = event.data.object as any;

    // Normalização de dados
    const stripe_object_id = data.id || data.payment_intent || data.checkout_session?.id || '';
    
    // Mapear status do Stripe para nosso status
    let status = data.status || 'unknown';
    if (type === 'checkout.session.completed') {
      status = data.payment_status === 'paid' ? 'succeeded' : 'pending';
    } else if (type === 'payment_intent.succeeded') {
      status = 'succeeded';
    } else if (type === 'charge.refunded') {
      status = 'refunded';
    } else if (type === 'payment_intent.canceled') {
      status = 'canceled';
    }

    const amount_gross_cents = data.amount_total ?? data.amount ?? 0;
    const currency = (data.currency || 'brl').toUpperCase();
    const email = data.customer_details?.email || data.receipt_email || null;
    const customer_id = data.customer || null;
    
    // Metadata enriquecido com informações de lote e cupom
    const metadata = data.metadata ?? {};
    
    // Adicionar email ao metadata para facilitar lookup
    if (email) {
      metadata.email = email;
    }
    
    // Tentar enriquecer metadata com dados de event_registrations se tivermos email
    if (email) {
      const { data: registration } = await supabaseClient
        .from('event_registrations')
        .select('category_name, coupon_code, batch_id, lote_id')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (registration) {
        metadata.lot_code = registration.category_name || metadata.lot_code;
        metadata.category_name = registration.category_name || metadata.category_name;
        metadata.coupon_code = registration.coupon_code || metadata.coupon_code;
        metadata.batch_id = registration.batch_id || metadata.batch_id;
        metadata.lote_id = registration.lote_id || metadata.lote_id;
      }
    }

    // Taxas (estimadas - para valores exatos usar Balance Transactions)
    const amount_fee_cents = data.application_fee_amount ?? Math.round(amount_gross_cents * 0.029 + 30);

    // Upsert idempotente usando event_id como chave
    const { error } = await supabaseClient
      .from('stripe_payments')
      .upsert({
        stripe_object_id,
        type: type.replace(/\./g, '_'),
        status,
        amount_gross_cents,
        amount_fee_cents,
        currency,
        email,
        customer_id,
        metadata,
        event_id: event.id,
        occurred_at
      }, { 
        onConflict: 'event_id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Error upserting payment:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Payment processed: ${stripe_object_id} - ${status}`);

    return new Response(JSON.stringify({ received: true, event_id: event.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});