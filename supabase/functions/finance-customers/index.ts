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

    // Buscar apenas registros com pagamento confirmado (pagos e gratuitos/vouchers)
    const { data: registrations, error: regError } = await supabaseClient
      .from('event_registrations')
      .select(`
        *,
        cursos:curso_id (
          id,
          nome_curso
        ),
        turmas:turma_id (
          id,
          nome_turma
        )
      `)
      .eq('payment_status', 'completed');
    
    if (regError) throw regError;

    console.log(`📝 Found ${registrations?.length || 0} paid/free registrations (excluding pending)`);
    
    // Log de debug para ver estrutura dos dados
    if (registrations && registrations.length > 0) {
      console.log('🔍 Exemplo de registro:', JSON.stringify({
        email: registrations[0].email,
        curso_id: registrations[0].curso_id,
        turma_id: registrations[0].turma_id,
        cursos: registrations[0].cursos,
        turmas: registrations[0].turmas
      }));
    }

    // Buscar todos os charges para pegar informações de cartão
    const { data: charges, error: chargesError } = await supabaseClient
      .from('stripe_charges')
      .select('id, payment_intent_id, brand, last4, customer_id');
    
    if (chargesError) throw chargesError;

    console.log(`💳 Found ${charges?.length || 0} charges with card info`);

    // Buscar reembolsos
    const { data: refunds } = await supabaseClient
      .from('stripe_refunds')
      .select('charge_id, amount');

    // Criar map de charges por payment_intent_id
    const chargesMap = new Map();
    charges?.forEach(charge => {
      if (charge.payment_intent_id) {
        chargesMap.set(charge.payment_intent_id, charge);
      }
    });

    // Criar map de reembolsos por charge_id
    const refundsMap = new Map();
    refunds?.forEach(refund => {
      if (!refundsMap.has(refund.charge_id)) {
        refundsMap.set(refund.charge_id, []);
      }
      refundsMap.get(refund.charge_id).push(refund);
    });

    // Agrupar registros por email
    const customersMap = new Map();
    
    registrations?.forEach(reg => {
      const email = reg.email;
      
      if (!customersMap.has(email)) {
        const cursoNome = reg.cursos?.nome_curso || 'Não especificado';
        const turmaNome = reg.turmas?.nome_turma || 'Não especificado';
        
        console.log(`👤 Criando customer ${email}: curso="${cursoNome}", turma="${turmaNome}"`);
        
        customersMap.set(email, {
          email,
          name: reg.full_name,
          curso: cursoNome,
          turma: turmaNome,
          total_gasto: 0,
          pagamentos: 0,
          reembolsos: 0,
          reembolsos_valor: 0,
          primeiro_pagamento: reg.created_at,
          ultimo_pagamento: reg.created_at,
          payment_methods: new Set(),
          card_brand: null,
          last4: null,
          registrations: []
        });
      }
      
      const customer = customersMap.get(email);
      customer.registrations.push(reg);
      
      // Atualizar datas
      if (new Date(reg.created_at) < new Date(customer.primeiro_pagamento)) {
        customer.primeiro_pagamento = reg.created_at;
      }
      if (new Date(reg.created_at) > new Date(customer.ultimo_pagamento)) {
        customer.ultimo_pagamento = reg.created_at;
      }
      
      // Adicionar ao total gasto
      customer.total_gasto += parseFloat(reg.amount_paid || 0);
      customer.pagamentos += 1;
      
      // Buscar informações do cartão no charge correspondente
      if (reg.stripe_payment_intent_id) {
        const charge = chargesMap.get(reg.stripe_payment_intent_id);
        if (charge) {
          if (!customer.card_brand && charge.brand) {
            customer.card_brand = charge.brand;
            customer.last4 = charge.last4;
          }
          if (charge.brand) {
            customer.payment_methods.add(charge.brand);
          }
          
          // Verificar se esse charge tem reembolsos
          const chargeRefunds = refundsMap.get(charge.id);
          if (chargeRefunds && chargeRefunds.length > 0) {
            customer.reembolsos += chargeRefunds.length;
            chargeRefunds.forEach(refund => {
              customer.reembolsos_valor += refund.amount / 100;
            });
          }
        }
      }
      
      // Comentado: busca por email foi removida pois a coluna não existe
      // A informação do cartão já foi obtida via payment_intent_id acima
    });

    console.log(`👥 Grouped into ${customersMap.size} unique customers`);

    // Converter para array e filtrar por search
    let customers = Array.from(customersMap.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.email.toLowerCase().includes(searchLower) || 
        c.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Ordenar por data mais recente (último pagamento)
    customers.sort((a, b) => new Date(b.ultimo_pagamento).getTime() - new Date(a.ultimo_pagamento).getTime());
    
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

      // Log para debug
      if (index === 0) {
        console.log('📊 Exemplo de customer:', {
          email: customer.email,
          card_brand: customer.card_brand,
          last4: customer.last4,
          payment_methods: Array.from(customer.payment_methods)
        });
      }

      // Obter tipo de participante da primeira inscrição
      const participantType = customer.registrations[0]?.participant_type || 'Não especificado';
      const paymentStatus = customer.registrations[0]?.payment_status || 'unknown';
      
      return {
        id: `customer_${offset + index}`,
        nome: customer.name,
        email: customer.email,
        participant_type: participantType,
        curso: customer.curso,
        turma: customer.turma,
        payment_status: paymentStatus,
        card_brand: customer.card_brand || null,
        last4: customer.last4 || null,
        forma_pagamento_padrao: Array.from(customer.payment_methods).join(', ') || 'Não definida',
        criado: formattedDate,
        total_gasto: customer.total_gasto,
        pagamentos: customer.pagamentos,
        reembolsos: customer.reembolsos,
        reembolsos_valor: customer.reembolsos_valor,
        stripe_link: `https://dashboard.stripe.com/payments?email=${encodeURIComponent(customer.email)}`
      };
    });

    console.log(`✅ Returning ${formatted.length} customers (total: ${totalCount})`);

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
