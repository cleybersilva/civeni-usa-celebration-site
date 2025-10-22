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

    console.log('✅ Webhook verified:', event.type, event.id);

    // 1. Gravar evento idempotente
    await supabaseClient.from('stripe_events').upsert({
      id: event.id,
      type: event.type,
      api_version: event.api_version,
      created_utc: new Date(event.created * 1000).toISOString(),
      received_at: new Date().toISOString(),
      payload_json: event,
      status: 'processing'
    }, { onConflict: 'id', ignoreDuplicates: false });

    const data = event.data.object as any;
    
    // 2. Processar por tipo de evento
    try {
      switch (event.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded':
        case 'checkout.session.async_payment_failed':
          await processCheckoutSession(supabaseClient, data);
          break;
        
        case 'payment_intent.succeeded':
        case 'payment_intent.payment_failed':
        case 'payment_intent.processing':
        case 'payment_intent.canceled':
        case 'payment_intent.created':
          await processPaymentIntent(supabaseClient, stripe, data);
          break;
        
        case 'charge.succeeded':
        case 'charge.failed':
        case 'charge.pending':
        case 'charge.refunded':
        case 'charge.updated':
          await processCharge(supabaseClient, stripe, data);
          break;
        
        case 'charge.dispute.created':
        case 'charge.dispute.updated':
        case 'charge.dispute.closed':
          await processDispute(supabaseClient, data);
          break;
        
        case 'refund.created':
        case 'refund.updated':
          await processRefund(supabaseClient, data);
          break;
        
        case 'payout.paid':
        case 'payout.failed':
        case 'payout.canceled':
        case 'payout.created':
          await processPayout(supabaseClient, data);
          break;
        
        case 'customer.created':
        case 'customer.updated':
          await processCustomer(supabaseClient, data);
          break;
        
        case 'customer.deleted':
          console.log('🗑️ Customer deleted:', data.id);
          // Manter histórico, não deletar
          break;
      }
      
      // Atualizar evento como processado
      await supabaseClient.from('stripe_events').update({
        processed_at: new Date().toISOString(),
        status: 'processed'
      }).eq('id', event.id);

      console.log(`✅ Event processed: ${event.type} - ${event.id}`);

    } catch (processingError) {
      console.error('❌ Error processing event:', processingError);
      
      // Gravar erro
      await supabaseClient.from('stripe_events').update({
        status: 'error',
        error: processingError.message
      }).eq('id', event.id);
      
      throw processingError;
    }

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

// ============================================
// HELPER FUNCTIONS
// ============================================

async function processCheckoutSession(supabase: any, session: any) {
  console.log('📝 Processing checkout session:', session.id);
  
  await supabase.from('stripe_checkout_sessions').upsert({
    id: session.id,
    payment_intent_id: session.payment_intent,
    customer_id: session.customer,
    mode: session.mode,
    status: session.status,
    currency: session.currency?.toUpperCase() || 'BRL',
    amount_total: session.amount_total,
    url: session.url,
    metadata: session.metadata || {},
    created_utc: new Date(session.created * 1000).toISOString()
  }, { onConflict: 'id', ignoreDuplicates: false });

  // Vincular com registration se houver email
  const email = session.customer_details?.email || session.customer_email;
  if (email) {
    await supabase.from('event_registrations').update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent
    }).eq('email', email).is('stripe_checkout_session_id', null);
  }
}

async function processPaymentIntent(supabase: any, stripe: any, intent: any) {
  console.log('💳 Processing payment intent:', intent.id);
  
  await supabase.from('stripe_payment_intents').upsert({
    id: intent.id,
    status: intent.status,
    amount: intent.amount,
    amount_received: intent.amount_received,
    currency: intent.currency?.toUpperCase() || 'BRL',
    confirmation_method: intent.confirmation_method,
    latest_charge_id: intent.latest_charge,
    customer_id: intent.customer,
    metadata: intent.metadata || {},
    created_utc: new Date(intent.created * 1000).toISOString()
  }, { onConflict: 'id', ignoreDuplicates: false });

  // Buscar charges associadas
  if (intent.latest_charge) {
    try {
      const charge = await stripe.charges.retrieve(intent.latest_charge, {
        expand: ['balance_transaction']
      });
      await processCharge(supabase, stripe, charge);
    } catch (err) {
      console.warn('⚠️ Could not fetch charge:', err.message);
    }
  }
}

async function processCharge(supabase: any, stripe: any, charge: any) {
  console.log('⚡ Processing charge:', charge.id);
  
  // Buscar balance transaction para taxas exatas
  let balanceTxn = charge.balance_transaction;
  if (typeof balanceTxn === 'string') {
    try {
      balanceTxn = await stripe.balanceTransactions.retrieve(balanceTxn);
    } catch (err) {
      console.warn('⚠️ Could not fetch balance transaction:', err.message);
    }
  }

  // Processar balance transaction se existir
  if (balanceTxn && typeof balanceTxn === 'object') {
    await supabase.from('stripe_balance_transactions').upsert({
      id: balanceTxn.id,
      amount: balanceTxn.amount,
      currency: balanceTxn.currency?.toUpperCase() || 'BRL',
      fee: balanceTxn.fee,
      net: balanceTxn.net,
      reporting_category: balanceTxn.reporting_category,
      available_on_utc: new Date(balanceTxn.available_on * 1000).toISOString(),
      created_utc: new Date(balanceTxn.created * 1000).toISOString(),
      source_id: balanceTxn.source,
      type: balanceTxn.type
    }, { onConflict: 'id', ignoreDuplicates: false });
  }

  // Extrair dados do cartão
  const card = charge.payment_method_details?.card || {};
  
  await supabase.from('stripe_charges').upsert({
    id: charge.id,
    payment_intent_id: charge.payment_intent,
    customer_id: charge.customer,
    status: charge.status,
    amount: charge.amount,
    currency: charge.currency?.toUpperCase() || 'BRL',
    paid: charge.paid,
    captured: charge.captured,
    balance_txn_id: typeof charge.balance_transaction === 'string' 
      ? charge.balance_transaction 
      : charge.balance_transaction?.id,
    brand: card.brand,
    funding: card.funding,
    last4: card.last4,
    exp_month: card.exp_month,
    exp_year: card.exp_year,
    card_country: card.country,
    receipt_url: charge.receipt_url,
    outcome_type: charge.outcome?.type,
    failure_code: charge.failure_code,
    failure_message: charge.failure_message,
    created_utc: new Date(charge.created * 1000).toISOString(),
    fee_amount: balanceTxn?.fee || 0,
    fee_currency: balanceTxn?.currency?.toUpperCase() || charge.currency?.toUpperCase() || 'BRL',
    net_amount: balanceTxn?.net || (charge.amount - (balanceTxn?.fee || 0))
  }, { onConflict: 'id', ignoreDuplicates: false });

  // Vincular com registration
  if (charge.payment_intent) {
    const { data: intent } = await supabase
      .from('stripe_payment_intents')
      .select('metadata')
      .eq('id', charge.payment_intent)
      .single();
    
    const email = intent?.metadata?.email || charge.receipt_email;
    if (email) {
      await supabase.from('event_registrations').update({
        stripe_charge_id: charge.id,
        stripe_payment_intent_id: charge.payment_intent
      }).eq('email', email).is('stripe_charge_id', null);
    }
  }

  // Atualizar stripe_payments antiga (compatibilidade)
  const { data: registration } = await supabase
    .from('event_registrations')
    .select('category_name, coupon_code, batch_id, lote_id, email')
    .eq('stripe_charge_id', charge.id)
    .maybeSingle();

  if (registration) {
    const metadata = {
      email: registration.email,
      lot_code: registration.category_name,
      category_name: registration.category_name,
      coupon_code: registration.coupon_code,
      batch_id: registration.batch_id,
      lote_id: registration.lote_id
    };

    await supabase.from('stripe_payments').upsert({
      stripe_object_id: charge.id,
      type: 'charge',
      status: charge.status,
      amount_gross_cents: charge.amount,
      amount_fee_cents: balanceTxn?.fee || 0,
      currency: charge.currency?.toUpperCase() || 'BRL',
      email: registration.email,
      customer_id: charge.customer,
      metadata,
      event_id: `charge_${charge.id}`,
      occurred_at: new Date(charge.created * 1000).toISOString()
    }, { onConflict: 'event_id', ignoreDuplicates: false });
  }
}

async function processDispute(supabase: any, dispute: any) {
  console.log('⚠️ Processing dispute:', dispute.id);
  
  await supabase.from('stripe_disputes').upsert({
    id: dispute.id,
    charge_id: dispute.charge,
    amount: dispute.amount,
    currency: dispute.currency?.toUpperCase() || 'BRL',
    reason: dispute.reason,
    status: dispute.status,
    evidence_due_by: dispute.evidence_details?.due_by 
      ? new Date(dispute.evidence_details.due_by * 1000).toISOString() 
      : null,
    created_utc: new Date(dispute.created * 1000).toISOString(),
    closed_utc: dispute.status === 'lost' || dispute.status === 'won' 
      ? new Date().toISOString() 
      : null
  }, { onConflict: 'id', ignoreDuplicates: false });
}

async function processRefund(supabase: any, refund: any) {
  console.log('🔄 Processing refund:', refund.id);
  
  await supabase.from('stripe_refunds').upsert({
    id: refund.id,
    charge_id: refund.charge,
    payment_intent_id: refund.payment_intent,
    status: refund.status,
    amount: refund.amount,
    currency: refund.currency?.toUpperCase() || 'BRL',
    reason: refund.reason,
    created_utc: new Date(refund.created * 1000).toISOString()
  }, { onConflict: 'id', ignoreDuplicates: false });
}

async function processPayout(supabase: any, payout: any) {
  console.log('💰 Processing payout:', payout.id);
  
  await supabase.from('stripe_payouts').upsert({
    id: payout.id,
    amount: payout.amount,
    currency: payout.currency?.toUpperCase() || 'BRL',
    arrival_date_utc: new Date(payout.arrival_date * 1000).toISOString(),
    status: payout.status,
    balance_txn_id: payout.balance_transaction,
    created_utc: new Date(payout.created * 1000).toISOString()
  }, { onConflict: 'id', ignoreDuplicates: false });
}

async function processCustomer(supabase: any, customer: any) {
  console.log('👤 Processing customer:', customer.id);
  
  await supabase.from('stripe_customers').upsert({
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    description: customer.description,
    metadata: customer.metadata || {},
    default_source: customer.default_source,
    invoice_prefix: customer.invoice_prefix,
    balance: customer.balance || 0,
    currency: customer.currency?.toUpperCase() || 'BRL',
    delinquent: customer.delinquent || false,
    discount: customer.discount,
    created_utc: new Date(customer.created * 1000).toISOString(),
    updated_utc: new Date().toISOString()
  }, { onConflict: 'id', ignoreDuplicates: false });
}