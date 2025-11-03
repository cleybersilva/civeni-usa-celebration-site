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

    console.log(`💳 Finance by brand requested: from=${from}, to=${to}`);

    // Query view otimizada
    let query = supabaseClient
      .from('v_fin_por_bandeira')
      .select('*')
      .eq('currency', currency.toUpperCase());

    const { data, error } = await query;

    if (error) throw error;

    // Se precisar filtrar por data (view não tem filtro temporal), fazer query manual
    if (from || to) {
      let chargeQuery = supabaseClient
        .from('stripe_charges')
        .select('brand, funding, amount, fee_amount, net_amount, stripe_balance_transactions(fee, net)')
        .eq('status', 'succeeded')
        .eq('paid', true)
        .eq('currency', currency.toUpperCase());

      if (from) chargeQuery = chargeQuery.gte('created_utc', from);
      if (to) chargeQuery = chargeQuery.lte('created_utc', to);

      const { data: charges, error: chargeError } = await chargeQuery;
      if (chargeError) throw chargeError;

      // Agregar
      const brandMap = new Map();
      (charges || []).forEach(charge => {
        const key = `${charge.brand || 'unknown'}_${charge.funding || 'unknown'}`;
        if (!brandMap.has(key)) {
          brandMap.set(key, {
            bandeira: charge.brand || 'unknown',
            funding: charge.funding || 'unknown',
            currency: currency.toUpperCase(),
            qtd: 0,
            receita_liquida: 0,
            receita_bruta: 0
          });
        }
        
        const bucket = brandMap.get(key);
        const bt = charge.stripe_balance_transactions;
        const net = bt?.net || charge.net_amount || (charge.amount - (bt?.fee || charge.fee_amount || 0));
        
        bucket.qtd++;
        bucket.receita_bruta += charge.amount / 100;
        bucket.receita_liquida += net / 100;
      });

      const aggregated = Array.from(brandMap.values()).sort((a, b) => 
        b.receita_liquida - a.receita_liquida
      );

      return new Response(JSON.stringify({ data: aggregated }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: data || [] }), {
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
