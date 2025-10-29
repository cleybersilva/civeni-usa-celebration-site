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
    const status = url.searchParams.get('status');
    const lote = url.searchParams.get('lote');
    const cupom = url.searchParams.get('cupom');
    const brand = url.searchParams.get('brand');

    console.log(`📊 Finance summary requested: from=${from}, to=${to}, currency=${currency}`);

    // Query base
    let query = supabaseClient
      .from('stripe_charges')
      .select(`
        *,
        stripe_balance_transactions!left(fee, net),
        stripe_payment_intents!left(metadata)
      `);

    // Filtros
    if (from) query = query.gte('created_utc', from);
    if (to) query = query.lte('created_utc', to);
    if (currency) query = query.eq('currency', currency.toUpperCase());
    if (status) query = query.eq('status', status);
    if (brand) query = query.eq('brand', brand);

    const { data: charges, error } = await query;

    if (error) throw error;

    // Filtrar por lote/cupom via metadata
    let filteredCharges = charges || [];
    if (lote || cupom) {
      filteredCharges = filteredCharges.filter(ch => {
        const pi = ch.stripe_payment_intents;
        if (!pi || !pi.metadata) return false;
        
        if (lote) {
          const chargeLote = pi.metadata.lot_code || pi.metadata.category_name;
          if (chargeLote !== lote) return false;
        }
        
        if (cupom) {
          const chargeCupom = pi.metadata.coupon_code;
          if (chargeCupom !== cupom) return false;
        }
        
        return true;
      });
    }

    // Calcular KPIs
    let bruto = 0, taxas = 0, liquido = 0;
    let pagos = 0, naoPagos = 0, falhas = 0;
    let reembolsosTotal = 0, disputasTotal = 0;

    filteredCharges.forEach(charge => {
      const bt = charge.stripe_balance_transactions;
      const amount = charge.amount || 0;
      const fee = bt?.fee || charge.fee_amount || 0;
      const net = bt?.net || charge.net_amount || (amount - fee);

      // Apenas somar valores para pagamentos confirmados e pagos
      if (charge.status === 'succeeded' && charge.paid) {
        bruto += amount;
        taxas += fee;
        liquido += net;
        pagos++;
      } else {
        naoPagos++;
        if (charge.failure_code) falhas++;
      }

      if (charge.refunded) reembolsosTotal++;
    });

    // Buscar disputas
    const { data: disputes } = await supabaseClient
      .from('stripe_disputes')
      .select('status, amount')
      .in('status', ['warning_needs_response', 'warning_under_review', 'needs_response', 'under_review']);
    
    disputasTotal = disputes?.length || 0;

    // Buscar próximo payout
    const { data: nextPayout } = await supabaseClient
      .from('stripe_payouts')
      .select('arrival_date_utc, amount, currency')
      .eq('status', 'in_transit')
      .order('arrival_date_utc', { ascending: true })
      .limit(1)
      .maybeSingle();

    const ticketMedio = pagos > 0 ? bruto / pagos : 0;
    const taxaConversao = (pagos + naoPagos) > 0 ? (pagos / (pagos + naoPagos)) * 100 : 0;

    const summary = {
      bruto: bruto / 100,
      taxas: taxas / 100,
      liquido: liquido / 100,
      pagos,
      naoPagos,
      falhas,
      reembolsos: reembolsosTotal,
      disputas: disputasTotal,
      ticketMedio: ticketMedio / 100,
      taxaConversao: taxaConversao.toFixed(2),
      proximoPayout: nextPayout ? {
        data: nextPayout.arrival_date_utc,
        valor: nextPayout.amount / 100,
        moeda: nextPayout.currency
      } : null,
      currency,
      periodo: { from, to }
    };

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching summary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
