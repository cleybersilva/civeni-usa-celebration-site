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
    const status = url.searchParams.get('status');
    const brand = url.searchParams.get('brand');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';

    console.log(`💵 Finance charges requested: limit=${limit}, offset=${offset}, search=${search}`);

    // Query com joins especificando qual FK usar (LEFT JOIN para customer ser opcional)
    let query = supabaseClient
      .from('stripe_charges')
      .select(`
        *,
        stripe_balance_transactions(fee, net),
        stripe_payment_intents(metadata, customer_id),
        stripe_customers!fk_stripe_charges_customer(email, name)
      `)
      .order('created_utc', { ascending: false })
      .range(offset, offset + limit - 1);

    if (from) query = query.gte('created_utc', from);
    if (to) query = query.lte('created_utc', to);
    if (status) query = query.eq('status', status);
    if (brand) query = query.eq('brand', brand);

    const { data: allCharges, error } = await query;

    if (error) throw error;

    // Filtrar por search se fornecido
    let charges = allCharges || [];
    if (search) {
      const searchLower = search.toLowerCase();
      charges = charges.filter(charge => {
        const customer = charge.stripe_customers;
        const pi = charge.stripe_payment_intents;
        const customerName = customer?.name || pi?.metadata?.full_name || '';
        const customerEmail = customer?.email || pi?.metadata?.email || '';
        const chargeId = charge.id || '';
        
        return customerName.toLowerCase().includes(searchLower) ||
               customerEmail.toLowerCase().includes(searchLower) ||
               chargeId.toLowerCase().includes(searchLower);
      });
    }

    const totalCount = charges.length;
    
    // Aplicar paginação
    charges = charges.slice(offset, offset + limit);

    // Formatar dados
    const formatted = charges.map(charge => {
      const bt = charge.stripe_balance_transactions;
      const pi = charge.stripe_payment_intents;
      const customer = charge.stripe_customers;
      
      // Converter timestamp para BRT
      const createdDate = new Date(charge.created_utc);
      const brtDate = new Date(createdDate.getTime() - 3 * 60 * 60 * 1000);

      return {
        id: charge.id,
        payment_intent_id: charge.payment_intent_id,
        data_hora_brt: brtDate.toISOString().replace('T', ' ').substring(0, 19),
        participante: customer?.name || pi?.metadata?.full_name || pi?.metadata?.email || customer?.email || 'N/A',
        email: customer?.email || pi?.metadata?.email || 'N/A',
        valor_bruto: charge.amount / 100,
        taxa: (bt?.fee || charge.fee_amount || 0) / 100,
        valor_liquido: (bt?.net || charge.net_amount || (charge.amount - (bt?.fee || charge.fee_amount || 0))) / 100,
        status: charge.status,
        paid: charge.paid,
        metodo: 'card',
        bandeira: charge.brand || 'unknown',
        funding: charge.funding || 'unknown',
        last4: charge.last4 ? `**** ${charge.last4}` : 'N/A',
        exp: charge.exp_month && charge.exp_year ? `${charge.exp_month}/${charge.exp_year}` : 'N/A',
        cupom: pi?.metadata?.coupon_code || 'sem_cupom',
        lote: pi?.metadata?.lot_code || pi?.metadata?.category_name || 'Sem Lote',
        failure_code: charge.failure_code,
        failure_message: charge.failure_message,
        receipt_url: charge.receipt_url,
        stripe_link: `https://dashboard.stripe.com/payments/${charge.id}`
      };
    });

    return new Response(JSON.stringify({
      data: formatted,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching charges:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
