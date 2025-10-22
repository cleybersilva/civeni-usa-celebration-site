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
    const by = url.searchParams.get('by') || 'lot';
    const range = url.searchParams.get('range') || '30d';

    // Calcular data de início
    let startDate = new Date();
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    let breakdownData: any[] = [];

    if (by === 'lot' || by === 'coupon') {
      // Usar MV para breakdown por lote/cupom
      const { data, error } = await supabaseClient
        .from('mv_revenue_by_lot_coupon')
        .select('*');

      if (error) throw error;

      if (by === 'lot') {
        // Agregar por lote
        const lotMap = new Map<string, any>();
        data?.forEach(row => {
          if (!lotMap.has(row.lot_code)) {
            lotMap.set(row.lot_code, {
              category: row.lot_code,
              payments: 0,
              gross_cents: 0,
              net_cents: 0
            });
          }
          const item = lotMap.get(row.lot_code)!;
          item.payments += row.payments;
          item.gross_cents += row.gross_cents;
          item.net_cents += row.net_cents;
        });

        breakdownData = Array.from(lotMap.values()).map(item => ({
          ...item,
          gross: item.gross_cents / 100,
          net: item.net_cents / 100
        })).sort((a, b) => b.net_cents - a.net_cents);
      } else {
        // Agregar por cupom
        const couponMap = new Map<string, any>();
        data?.forEach(row => {
          if (row.coupon_code === 'sem_cupom') return; // Ignorar "sem cupom"
          
          if (!couponMap.has(row.coupon_code)) {
            couponMap.set(row.coupon_code, {
              category: row.coupon_code,
              payments: 0,
              gross_cents: 0,
              net_cents: 0
            });
          }
          const item = couponMap.get(row.coupon_code)!;
          item.payments += row.payments;
          item.gross_cents += row.gross_cents;
          item.net_cents += row.net_cents;
        });

        breakdownData = Array.from(couponMap.values()).map(item => ({
          ...item,
          gross: item.gross_cents / 100,
          net: item.net_cents / 100
        })).sort((a, b) => b.net_cents - a.net_cents);
      }
    } else if (by === 'payment_method') {
      // Agregar por método de pagamento do metadata
      const { data, error } = await supabaseClient
        .from('stripe_payments')
        .select('metadata, amount_gross_cents, amount_net_cents')
        .in('status', ['succeeded', 'paid', 'completed'])
        .gte('occurred_at', startDate.toISOString());

      if (error) throw error;

      const methodMap = new Map<string, any>();
      data?.forEach(payment => {
        const method = payment.metadata?.payment_method || 'card';
        if (!methodMap.has(method)) {
          methodMap.set(method, {
            category: method,
            payments: 0,
            gross_cents: 0,
            net_cents: 0
          });
        }
        const item = methodMap.get(method)!;
        item.payments++;
        item.gross_cents += payment.amount_gross_cents;
        item.net_cents += payment.amount_net_cents;
      });

      breakdownData = Array.from(methodMap.values()).map(item => ({
        ...item,
        gross: item.gross_cents / 100,
        net: item.net_cents / 100
      })).sort((a, b) => b.net_cents - a.net_cents);
    }

    return new Response(JSON.stringify({ by, range, data: breakdownData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching breakdown:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});