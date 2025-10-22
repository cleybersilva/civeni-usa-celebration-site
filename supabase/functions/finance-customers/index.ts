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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';

    console.log(`👥 Finance customers requested: limit=${limit}, offset=${offset}, search=${search}`);

    // Buscar charges com payment intents para obter dados
    const { data: charges, error: chargesError } = await supabaseClient
      .from('stripe_charges')
      .select(`
        *,
        stripe_balance_transactions(fee, net),
        stripe_payment_intents(metadata)
      `);
    
    if (chargesError) throw chargesError;

    // Buscar checkout sessions
    const { data: checkoutSessions } = await supabaseClient
      .from('stripe_checkout_sessions')
      .select('*');

    // Buscar reembolsos
    const { data: refunds } = await supabaseClient
      .from('stripe_refunds')
      .select('charge_id, amount');

    // Criar map de checkout sessions por payment_intent_id
    const sessionsMap = new Map();
    checkoutSessions?.forEach(session => {
      if (session.payment_intent_id) {
        sessionsMap.set(session.payment_intent_id, session);
      }
    });

    // Agrupar charges por combinação de email/nome ou criar cliente único por charge
    const customersMap = new Map();
    
    charges?.forEach(charge => {
      const pi = charge.stripe_payment_intents;
      const session = sessionsMap.get(charge.payment_intent_id);
      
      // Tentar obter email/nome de várias fontes
      const email = pi?.metadata?.email || 
                    session?.metadata?.email || 
                    pi?.metadata?.customer_email ||
                    `cliente_${charge.id.substring(0, 8)}@virtual.com`;
      
      const name = pi?.metadata?.full_name || 
                   pi?.metadata?.name ||
                   session?.metadata?.full_name ||
                   session?.metadata?.name ||
                   `Cliente ${charge.last4 || 'Anônimo'}`;
      
      if (!customersMap.has(email)) {
        customersMap.set(email, {
          email,
          name,
          total_gasto: 0,
          pagamentos: 0,
          reembolsos: 0,
          reembolsos_valor: 0,
          primeiro_pagamento: charge.created_utc,
          ultimo_pagamento: charge.created_utc,
          payment_methods: new Set(),
          card_brand: null,
          last4: null
        });
      }
      
      const customer = customersMap.get(email);
      
      // Atualizar datas
      if (new Date(charge.created_utc) < new Date(customer.primeiro_pagamento)) {
        customer.primeiro_pagamento = charge.created_utc;
      }
      if (new Date(charge.created_utc) > new Date(customer.ultimo_pagamento)) {
        customer.ultimo_pagamento = charge.created_utc;
      }
      
      // Calcular valores
      if (charge.status === 'succeeded' && charge.paid) {
        customer.total_gasto += charge.amount / 100;
        customer.pagamentos += 1;
        
        // Pegar informações do cartão do primeiro pagamento bem-sucedido
        if (!customer.card_brand && charge.brand) {
          customer.card_brand = charge.brand;
          customer.last4 = charge.last4;
        }
      }
      
      if (charge.brand) {
        customer.payment_methods.add(charge.brand);
      }
    });

    // Calcular reembolsos
    refunds?.forEach(refund => {
      const charge = charges?.find(c => c.id === refund.charge_id);
      if (!charge) return;
      
      const pi = charge.stripe_payment_intents;
      const session = sessionsMap.get(charge.payment_intent_id);
      
      const email = pi?.metadata?.email || 
                    session?.metadata?.email || 
                    pi?.metadata?.customer_email ||
                    `cliente_${charge.id.substring(0, 8)}@virtual.com`;
      
      const customer = customersMap.get(email);
      if (customer) {
        customer.reembolsos += 1;
        customer.reembolsos_valor += refund.amount / 100;
      }
    });

    // Converter para array e filtrar por search
    let customers = Array.from(customersMap.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.email.toLowerCase().includes(searchLower) || 
        c.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Ordenar por total gasto
    customers.sort((a, b) => b.total_gasto - a.total_gasto);
    
    const totalCount = customers.length;
    
    // Aplicar paginação
    customers = customers.slice(offset, offset + limit);

    // Formatar dados para BRT com formato brasileiro
    const formatted = customers.map((customer, index) => {
      const createdDate = new Date(customer.primeiro_pagamento);
      const brtDate = new Date(createdDate.getTime() - 3 * 60 * 60 * 1000);
      
      // Formatar data no estilo brasileiro: "22 de out. 07:42"
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const day = brtDate.getDate();
      const month = months[brtDate.getMonth()];
      const hours = String(brtDate.getHours()).padStart(2, '0');
      const minutes = String(brtDate.getMinutes()).padStart(2, '0');
      const formattedDate = `${day} de ${month}. ${hours}:${minutes}`;

      return {
        id: `virtual_${offset + index}`,
        nome: customer.name,
        email: customer.email,
        card_brand: customer.card_brand,
        last4: customer.last4,
        forma_pagamento_padrao: Array.from(customer.payment_methods).join(', ') || 'Não definida',
        criado: formattedDate,
        total_gasto: customer.total_gasto,
        pagamentos: customer.pagamentos,
        reembolsos: customer.reembolsos,
        reembolsos_valor: customer.reembolsos_valor,
        stripe_link: `https://dashboard.stripe.com/payments?email=${encodeURIComponent(customer.email)}`
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
    console.error('❌ Error fetching customers:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
