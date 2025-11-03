import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const currency = url.searchParams.get('currency') || 'BRL';

    console.log(`💳 Finance by payment method requested: from=${from}, to=${to}`);

    // Query charges com payment_method_details
    let chargeQuery = supabaseClient
      .from('stripe_charges')
      .select('amount, fee_amount, net_amount, status, paid, payment_method_details, stripe_balance_transactions(fee, net)')
      .eq('status', 'succeeded')
      .eq('paid', true)
      .eq('currency', currency.toUpperCase());

    if (from) chargeQuery = chargeQuery.gte('created_utc', from);
    if (to) chargeQuery = chargeQuery.lte('created_utc', to);

    const { data: charges, error: chargeError } = await chargeQuery;
    if (chargeError) {
      console.error('❌ Error fetching charges:', chargeError);
      throw chargeError;
    }

    console.log(`📊 Found ${charges?.length || 0} charges to process`);

    // Mapear por forma de pagamento
    const methodMap = new Map();
    (charges || []).forEach(charge => {
      let paymentType = 'Outros';
      let paymentDetails = {};
      
      try {
        paymentDetails = typeof charge.payment_method_details === 'string' 
          ? JSON.parse(charge.payment_method_details) 
          : charge.payment_method_details || {};
      } catch (e) {
        console.error('Error parsing payment_method_details:', e);
      }

      const type = paymentDetails?.type || 'other';
      
      if (type === 'card') {
        paymentType = 'Cartão';
      } else if (type === 'boleto') {
        paymentType = 'Boleto';
      } else if (type === 'pix') {
        paymentType = 'Pix';
      }

      if (!methodMap.has(paymentType)) {
        methodMap.set(paymentType, {
          forma_pagamento: paymentType,
          currency: currency.toUpperCase(),
          qtd: 0,
          receita_liquida: 0,
          receita_bruta: 0
        });
      }
      
      const bucket = methodMap.get(paymentType);
      const bt = charge.stripe_balance_transactions;
      const net = bt?.net || charge.net_amount || (charge.amount - (bt?.fee || charge.fee_amount || 0));
      
      bucket.qtd++;
      bucket.receita_bruta += charge.amount / 100;
      bucket.receita_liquida += net / 100;
    });

    const aggregated = Array.from(methodMap.values()).sort((a, b) => 
      b.receita_liquida - a.receita_liquida
    );

    console.log(`✅ Aggregated ${aggregated.length} payment methods:`, aggregated);

    return new Response(JSON.stringify({ data: aggregated }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching by-brand:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
