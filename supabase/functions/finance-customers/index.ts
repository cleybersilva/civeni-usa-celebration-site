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

    // Buscar da view v_fin_customers que já tem os cálculos
    let query = supabaseClient
      .from('v_fin_customers')
      .select('*')
      .order('total_gasto', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtro de busca por email ou nome
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data: customers, error, count } = await query;

    if (error) throw error;

    // Formatar dados para BRT
    const formatted = (customers || []).map(customer => {
      const createdDate = new Date(customer.created_utc);
      const brtDate = new Date(createdDate.getTime() - 3 * 60 * 60 * 1000);
      
      const lastPaymentDate = customer.ultimo_pagamento ? new Date(customer.ultimo_pagamento) : null;
      const lastPaymentBRT = lastPaymentDate 
        ? new Date(lastPaymentDate.getTime() - 3 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
        : null;

      return {
        id: customer.id,
        nome: customer.name || 'N/A',
        email: customer.email || 'N/A',
        forma_pagamento_padrao: customer.forma_pagamento_padrao || 'Não definida',
        criado: brtDate.toISOString().replace('T', ' ').substring(0, 19),
        total_gasto: customer.total_gasto || 0,
        pagamentos: customer.total_pagamentos || 0,
        reembolsos: customer.total_reembolsos || 0,
        ultimo_pagamento: lastPaymentBRT,
        stripe_link: `https://dashboard.stripe.com/customers/${customer.id}`
      };
    });

    // Total count para paginação
    const { count: totalCount } = await supabaseClient
      .from('v_fin_customers')
      .select('*', { count: 'exact', head: true });

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
