import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { since, until, resources = ['payment_intents', 'charges', 'refunds', 'payouts', 'customers'] } = await req.json();

    console.log(`🔄 Stripe sync requested: since=${since}, until=${until}, resources=${resources.join(',')}`);

    const results: any = {
      synced: 0,
      errors: [],
      resources: {}
    };

    const sinceTimestamp = since ? Math.floor(new Date(since).getTime() / 1000) : undefined;
    const untilTimestamp = until ? Math.floor(new Date(until).getTime() / 1000) : undefined;

    // Sync Payment Intents
    if (resources.includes('payment_intents')) {
      console.log('📝 Syncing payment intents...');
      let hasMore = true;
      let startingAfter: string | undefined;
      let piCount = 0;

      while (hasMore) {
        const params: any = {
          limit: 100,
          expand: ['data.latest_charge']
        };
        if (sinceTimestamp) params.created = { gte: sinceTimestamp };
        if (untilTimestamp) params.created = { ...params.created, lte: untilTimestamp };
        if (startingAfter) params.starting_after = startingAfter;

        const intents = await stripe.paymentIntents.list(params);

        for (const intent of intents.data) {
          await supabaseClient.from('stripe_payment_intents').upsert({
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

          piCount++;

          // Sync latest charge
          if (intent.latest_charge && typeof intent.latest_charge === 'object') {
            await syncCharge(supabaseClient, stripe, intent.latest_charge);
          }
        }

        hasMore = intents.has_more;
        if (hasMore && intents.data.length > 0) {
          startingAfter = intents.data[intents.data.length - 1].id;
        }
      }

      results.resources.payment_intents = piCount;
      results.synced += piCount;
      console.log(`✅ Synced ${piCount} payment intents`);
    }

    // Sync Charges
    if (resources.includes('charges')) {
      console.log('⚡ Syncing charges...');
      let hasMore = true;
      let startingAfter: string | undefined;
      let chargeCount = 0;

      while (hasMore) {
        const params: any = {
          limit: 100,
          expand: ['data.balance_transaction']
        };
        if (sinceTimestamp) params.created = { gte: sinceTimestamp };
        if (untilTimestamp) params.created = { ...params.created, lte: untilTimestamp };
        if (startingAfter) params.starting_after = startingAfter;

        const charges = await stripe.charges.list(params);

        for (const charge of charges.data) {
          await syncCharge(supabaseClient, stripe, charge);
          chargeCount++;
        }

        hasMore = charges.has_more;
        if (hasMore && charges.data.length > 0) {
          startingAfter = charges.data[charges.data.length - 1].id;
        }
      }

      results.resources.charges = chargeCount;
      results.synced += chargeCount;
      console.log(`✅ Synced ${chargeCount} charges`);
    }

    // Sync Refunds
    if (resources.includes('refunds')) {
      console.log('🔄 Syncing refunds...');
      let hasMore = true;
      let startingAfter: string | undefined;
      let refundCount = 0;

      while (hasMore) {
        const params: any = { limit: 100 };
        if (sinceTimestamp) params.created = { gte: sinceTimestamp };
        if (untilTimestamp) params.created = { ...params.created, lte: untilTimestamp };
        if (startingAfter) params.starting_after = startingAfter;

        const refunds = await stripe.refunds.list(params);

        for (const refund of refunds.data) {
          await supabaseClient.from('stripe_refunds').upsert({
            id: refund.id,
            charge_id: refund.charge,
            payment_intent_id: refund.payment_intent,
            status: refund.status,
            amount: refund.amount,
            currency: refund.currency?.toUpperCase() || 'BRL',
            reason: refund.reason,
            created_utc: new Date(refund.created * 1000).toISOString()
          }, { onConflict: 'id', ignoreDuplicates: false });

          refundCount++;
        }

        hasMore = refunds.has_more;
        if (hasMore && refunds.data.length > 0) {
          startingAfter = refunds.data[refunds.data.length - 1].id;
        }
      }

      results.resources.refunds = refundCount;
      results.synced += refundCount;
      console.log(`✅ Synced ${refundCount} refunds`);
    }

    // Sync Payouts
    if (resources.includes('payouts')) {
      console.log('💰 Syncing payouts...');
      let hasMore = true;
      let startingAfter: string | undefined;
      let payoutCount = 0;

      while (hasMore) {
        const params: any = { limit: 100 };
        if (sinceTimestamp) params.created = { gte: sinceTimestamp };
        if (untilTimestamp) params.created = { ...params.created, lte: untilTimestamp };
        if (startingAfter) params.starting_after = startingAfter;

        const payouts = await stripe.payouts.list(params);

        for (const payout of payouts.data) {
          await supabaseClient.from('stripe_payouts').upsert({
            id: payout.id,
            amount: payout.amount,
            currency: payout.currency?.toUpperCase() || 'BRL',
            arrival_date_utc: new Date(payout.arrival_date * 1000).toISOString(),
            status: payout.status,
            balance_txn_id: payout.balance_transaction,
            created_utc: new Date(payout.created * 1000).toISOString()
          }, { onConflict: 'id', ignoreDuplicates: false });

          payoutCount++;
        }

        hasMore = payouts.has_more;
        if (hasMore && payouts.data.length > 0) {
          startingAfter = payouts.data[payouts.data.length - 1].id;
        }
      }

      results.resources.payouts = payoutCount;
      results.synced += payoutCount;
      console.log(`✅ Synced ${payoutCount} payouts`);
    }

    // Sync Customers
    if (resources.includes('customers')) {
      console.log('👤 Syncing customers...');
      let hasMore = true;
      let startingAfter: string | undefined;
      let customerCount = 0;

      while (hasMore) {
        const params: any = { limit: 100 };
        if (sinceTimestamp) params.created = { gte: sinceTimestamp };
        if (untilTimestamp) params.created = { ...params.created, lte: untilTimestamp };
        if (startingAfter) params.starting_after = startingAfter;

        const customers = await stripe.customers.list(params);

        for (const customer of customers.data) {
          await supabaseClient.from('stripe_customers').upsert({
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

          customerCount++;
        }

        hasMore = customers.has_more;
        if (hasMore && customers.data.length > 0) {
          startingAfter = customers.data[customers.data.length - 1].id;
        }
      }

      results.resources.customers = customerCount;
      results.synced += customerCount;
      console.log(`✅ Synced ${customerCount} customers`);
    }

    console.log(`🎉 Sync completed: ${results.synced} total records`);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error syncing:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncCharge(supabase: any, stripe: any, charge: any) {
  let balanceTxn = charge.balance_transaction;
  if (typeof balanceTxn === 'string') {
    try {
      balanceTxn = await stripe.balanceTransactions.retrieve(balanceTxn);
    } catch (err) {
      console.warn('⚠️ Could not fetch balance transaction:', err.message);
    }
  }

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
}
