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
    const granularity = url.searchParams.get('granularity') || 'day'; // hour | day
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const currency = url.searchParams.get('currency') || 'BRL';

    console.log(`📈 Finance timeseries requested: granularity=${granularity}, from=${from}, to=${to}`);

    // Query view otimizada
    const { data, error } = await supabaseClient
      .from('v_fin_receita_diaria')
      .select('*')
      .eq('currency', currency.toUpperCase())
      .gte('dia', from || '2024-01-01')
      .lte('dia', to || new Date().toISOString())
      .order('dia', { ascending: true });

    if (error) throw error;

    // Se granularity === 'hour', buscar dados horários
    let seriesData = data || [];
    
    if (granularity === 'hour') {
      const { data: hourlyData, error: hourlyError } = await supabaseClient
        .from('stripe_charges')
        .select('created_utc, amount, fee_amount, net_amount, status, paid, stripe_balance_transactions(fee, net)')
        .eq('currency', currency.toUpperCase())
        .eq('status', 'succeeded')
        .eq('paid', true)
        .gte('created_utc', from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_utc', to || new Date().toISOString())
        .order('created_utc', { ascending: true });

      if (hourlyError) throw hourlyError;

      // Agrupar por hora (timezone America/Fortaleza)
      const hourlyMap = new Map();
      
      (hourlyData || []).forEach(charge => {
        const date = new Date(charge.created_utc);
        // Converter para BRT (-03:00)
        const brtDate = new Date(date.getTime() - 3 * 60 * 60 * 1000);
        const hourKey = `${brtDate.toISOString().split('T')[0]}T${brtDate.getUTCHours().toString().padStart(2, '0')}:00:00`;
        
        if (!hourlyMap.has(hourKey)) {
          hourlyMap.set(hourKey, {
            timestamp: hourKey,
            receita_bruta: 0,
            taxas: 0,
            receita_liquida: 0,
            transacoes: 0
          });
        }
        
        const bucket = hourlyMap.get(hourKey);
        const bt = charge.stripe_balance_transactions;
        const fee = bt?.fee || charge.fee_amount || 0;
        const net = bt?.net || charge.net_amount || (charge.amount - fee);
        
        bucket.receita_bruta += charge.amount / 100;
        bucket.taxas += fee / 100;
        bucket.receita_liquida += net / 100;
        bucket.transacoes += 1;
      });
      
      seriesData = Array.from(hourlyMap.values()).sort((a, b) => 
        a.timestamp.localeCompare(b.timestamp)
      );
    }

    return new Response(JSON.stringify({ granularity, data: seriesData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching timeseries:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
