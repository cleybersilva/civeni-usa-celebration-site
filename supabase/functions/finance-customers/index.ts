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

    // Buscar clientes dos payment intents (agrupados por email)
    const { data: paymentIntents, error: piError } = await supabaseClient
      .from('stripe_payment_intents')
      .select('*');
    
    if (piError) throw piError;

    // Buscar charges para calcular valores
    const { data: charges, error: chargesError } = await supabaseClient
      .from('stripe_charges')
      .select(`
        *,
        stripe_balance_transactions(fee, net)
      `);
    
    if (chargesError) throw chargesError;

    // Agrupar por email dos metadados
    const customersMap = new Map();
    
    paymentIntents?.forEach(pi => {
      const email = pi.metadata?.email || pi.metadata?.customer_email || 'N/A';
      const name = pi.metadata?.full_name || pi.metadata?.customer_name || 'N/A';
      
      if (!customersMap.has(email)) {
        customersMap.set(email, {
          email,
          name,
          total_gasto: 0,
          pagamentos: 0,
          reembolsos: 0,
          primeiro_pagamento: pi.created_utc,
          ultimo_pagamento: pi.created_utc,
          payment_methods: new Set()
        });
      }
      
      const customer = customersMap.get(email);
      
      // Atualizar datas
      if (new Date(pi.created_utc) < new Date(customer.primeiro_pagamento)) {
        customer.primeiro_pagamento = pi.created_utc;
      }
      if (new Date(pi.created_utc) > new Date(customer.ultimo_pagamento)) {
        customer.ultimo_pagamento = pi.created_utc;
      }
    });

    // Calcular valores das charges
    charges?.forEach(charge => {
      const pi = paymentIntents?.find(p => p.id === charge.payment_intent_id);
      if (!pi) return;
      
      const email = pi.metadata?.email || pi.metadata?.customer_email || 'N/A';
      const customer = customersMap.get(email);
      if (!customer) return;
      
      if (charge.status === 'succeeded' && charge.paid) {
        customer.total_gasto += charge.amount / 100;
        customer.pagamentos += 1;
      }
      
      if (charge.refunded) {
        customer.reembolsos += 1;
      }
      
      if (charge.brand) {
        customer.payment_methods.add(charge.brand);
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

    // Formatar dados para BRT
    const formatted = customers.map((customer, index) => {
      const createdDate = new Date(customer.primeiro_pagamento);
      const brtDate = new Date(createdDate.getTime() - 3 * 60 * 60 * 1000);
      
      const lastPaymentDate = new Date(customer.ultimo_pagamento);
      const lastPaymentBRT = new Date(lastPaymentDate.getTime() - 3 * 60 * 60 * 1000)
        .toISOString().replace('T', ' ').substring(0, 19);

      return {
        id: `virtual_${offset + index}`,
        nome: customer.name,
        email: customer.email,
        forma_pagamento_padrao: Array.from(customer.payment_methods).join(', ') || 'Não definida',
        criado: brtDate.toISOString().replace('T', ' ').substring(0, 19),
        total_gasto: customer.total_gasto,
        pagamentos: customer.pagamentos,
        reembolsos: customer.reembolsos,
        ultimo_pagamento: lastPaymentBRT,
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
