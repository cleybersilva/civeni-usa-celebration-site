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

    console.log(`💳 Finance by payment method requested: from=${from}, to=${to}, currency=${currency}`);

    // Query charges com brand e funding (colunas que existem)
    let chargeQuery = supabaseClient
      .from('stripe_charges')
      .select('amount, fee_amount, net_amount, status, paid, brand, funding, stripe_balance_transactions(fee, net)')
      .eq('status', 'succeeded')
      .eq('paid', true)
      .eq('currency', currency.toUpperCase());

    if (from) chargeQuery = chargeQuery.gte('created_utc', from);
    if (to) chargeQuery = chargeQuery.lte('created_utc', to);

    console.log('🔍 Executing charges query...');
    const { data: charges, error: chargeError } = await chargeQuery;
    
    if (chargeError) {
      console.error('❌ Error fetching charges:', chargeError);
      throw chargeError;
    }

    console.log(`📊 Found ${charges?.length || 0} charges to process`);
    
    // Se não há charges, retornar array vazio
    if (!charges || charges.length === 0) {
      console.log('⚠️ No charges found, returning empty array');
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mapear por forma de pagamento
    const methodMap = new Map();
    (charges || []).forEach((charge, index) => {
      let paymentType = 'Outros';
      
      // Se tem brand preenchido, é cartão
      if (charge.brand && charge.brand.trim() !== '') {
        paymentType = 'Cartão';
      }
      // Charges sem brand podem ser Boleto, Pix ou outras formas
      // Por enquanto classificamos como "Outros" até termos esses dados
      
      if (index < 3) {
        console.log(`📝 Sample charge ${index + 1}:`, { brand: charge.brand, funding: charge.funding, type: paymentType });
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

    console.log(`✅ Aggregated ${aggregated.length} payment methods:`, JSON.stringify(aggregated));

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
