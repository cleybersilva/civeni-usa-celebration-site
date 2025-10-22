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

    console.log(`📊 Finance breakdown requested: by=${by}, range=${range}`);

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

    console.log(`📅 Start date filter: ${startDate.toISOString()}`);

    let breakdownData: any[] = [];

    if (by === 'lot' || by === 'coupon') {
      // Buscar pagamentos confirmados do Stripe com filtro de data
      const { data: payments, error } = await supabaseClient
        .from('stripe_payments')
        .select('metadata, amount_gross_cents, amount_net_cents, occurred_at')
        .in('status', ['succeeded', 'paid', 'completed'])
        .gte('occurred_at', startDate.toISOString());

      if (error) {
        console.error('❌ Error fetching payments:', error);
        throw error;
      }

      console.log(`✅ Found ${payments?.length || 0} payments`);

      if (by === 'lot') {
        // Buscar registrations para enriquecer dados de lote
        const { data: registrations } = await supabaseClient
          .from('event_registrations')
          .select('email, category_name, batch_id, lote_id');

        console.log(`✅ Found ${registrations?.length || 0} registrations`);

        // Criar mapa de email -> dados de lote
        const emailToLot = new Map<string, string>();
        registrations?.forEach(reg => {
          if (reg.email && reg.category_name) {
            emailToLot.set(reg.email, reg.category_name);
          }
        });

        console.log(`✅ Created email->lot map with ${emailToLot.size} entries`);

        // Agregar por lote
        const lotMap = new Map<string, any>();
        payments?.forEach(payment => {
          // Tentar obter lote do metadata ou do mapa de registrations
          let lotCode = payment.metadata?.lot_code || payment.metadata?.category_name;
          
          // Se não tem no metadata, tentar buscar pelo email
          if (!lotCode && payment.metadata?.email) {
            lotCode = emailToLot.get(payment.metadata.email);
          }
          
          // Fallback para "Sem Lote"
          if (!lotCode) {
            lotCode = 'Sem Lote';
          }

          if (!lotMap.has(lotCode)) {
            lotMap.set(lotCode, {
              category: lotCode,
              payments: 0,
              gross_cents: 0,
              net_cents: 0
            });
          }
          const item = lotMap.get(lotCode)!;
          item.payments += 1;
          item.gross_cents += payment.amount_gross_cents || 0;
          item.net_cents += payment.amount_net_cents || 0;
        });

        console.log(`✅ Aggregated ${lotMap.size} lot categories`);

        breakdownData = Array.from(lotMap.values()).map(item => ({
          ...item,
          gross: item.gross_cents / 100,
          net: item.net_cents / 100
        })).sort((a, b) => b.net_cents - a.net_cents);
      } else {
        // Agregar por cupom
        const couponMap = new Map<string, any>();
        payments?.forEach(payment => {
          const couponCode = payment.metadata?.coupon_code || payment.metadata?.cupom;
          if (!couponCode || couponCode === 'sem_cupom') return; // Ignorar "sem cupom"
          
          if (!couponMap.has(couponCode)) {
            couponMap.set(couponCode, {
              category: couponCode,
              payments: 0,
              gross_cents: 0,
              net_cents: 0
            });
          }
          const item = couponMap.get(couponCode)!;
          item.payments += 1;
          item.gross_cents += payment.amount_gross_cents || 0;
          item.net_cents += payment.amount_net_cents || 0;
        });

        console.log(`✅ Aggregated ${couponMap.size} coupon categories`);

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

    console.log(`📊 Returning ${breakdownData.length} breakdown items`);

    return new Response(JSON.stringify({ by, range, data: breakdownData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching breakdown:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});