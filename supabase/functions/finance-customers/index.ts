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
    const cursoFilter = url.searchParams.get('curso') || '';
    const turmaFilter = url.searchParams.get('turma') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const paymentMethodFilter = url.searchParams.get('payment_method') || '';
    const startDate = url.searchParams.get('start_date') || '';
    const endDate = url.searchParams.get('end_date') || '';

    console.log(`👥 Finance customers requested: limit=${limit}, offset=${offset}, search=${search}, filters={curso:${cursoFilter}, turma:${turmaFilter}, status:${statusFilter}, payment_method:${paymentMethodFilter}, dates:${startDate}-${endDate}}`);

    // Buscar registros com base nos filtros
    let query = supabaseClient
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
      `);
    
    // Aplicar filtros
    if (statusFilter) {
      query = query.eq('payment_status', statusFilter);
    } else {
      // Por padrão, excluir apenas pending (mostra completed e free/voucher)
      query = query.neq('payment_status', 'pending');
    }
    
    if (cursoFilter) {
      query = query.eq('curso_id', cursoFilter);
    }
    
    if (turmaFilter) {
      query = query.eq('turma_id', turmaFilter);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data: registrations, error: regError } = await query;
    
    if (regError) throw regError;

    console.log(`📝 Found ${registrations?.length || 0} paid/free registrations (excluding pending)${cursoFilter ? ` for curso ${cursoFilter}` : ''}`);
    
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

    // Buscar pagamentos do Stripe com email e informações do cartão
    const { data: stripePayments, error: paymentsError } = await supabaseClient
      .from('stripe_payments')
      .select('email, customer_id, metadata');
    
    if (paymentsError) throw paymentsError;

    console.log(`💳 Found ${stripePayments?.length || 0} stripe payments`);

    // Buscar todos os charges para pegar informações de cartão
    const { data: charges, error: chargesError } = await supabaseClient
      .from('stripe_charges')
      .select('id, payment_intent_id, brand, last4, customer_id');
    
    if (chargesError) throw chargesError;

    console.log(`💳 Found ${charges?.length || 0} charges with card info`);
    
    // Log sample charge for debugging
    if (charges && charges.length > 0) {
      console.log('💳 Sample charge:', JSON.stringify({
        payment_intent_id: charges[0].payment_intent_id,
        brand: charges[0].brand,
        last4: charges[0].last4,
        customer_id: charges[0].customer_id
      }));
    }

    // Criar map de charges por customer_id
    const chargesByCustomer = new Map();
    charges?.forEach(charge => {
      if (charge.customer_id) {
        if (!chargesByCustomer.has(charge.customer_id)) {
          chargesByCustomer.set(charge.customer_id, []);
        }
        chargesByCustomer.get(charge.customer_id).push(charge);
      }
    });

    // Criar map de payment data por email
    const paymentsByEmail = new Map();
    stripePayments?.forEach(payment => {
      if (payment.email) {
        paymentsByEmail.set(payment.email.toLowerCase(), payment);
      }
    });

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
    refunds?.forEach((refund: { charge_id: string; amount: number }) => {
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
      
      // Buscar informações do cartão através do email no stripe_payments
      const emailLower = email.toLowerCase();
      const paymentInfo = paymentsByEmail.get(emailLower);
      
      if (paymentInfo && paymentInfo.customer_id) {
        const customerCharges = chargesByCustomer.get(paymentInfo.customer_id);
        if (customerCharges && customerCharges.length > 0) {
          const latestCharge = customerCharges[customerCharges.length - 1];
          console.log(`💳 Encontrado charge para ${email}: brand=${latestCharge.brand}, last4=${latestCharge.last4}`);
          
          if (!customer.card_brand && latestCharge.brand) {
            customer.card_brand = latestCharge.brand;
            customer.last4 = latestCharge.last4;
          }
          if (latestCharge.brand) {
            customer.payment_methods.add(latestCharge.brand);
          }
          
          // Verificar se esse charge tem reembolsos
          const chargeRefunds = refundsMap.get(latestCharge.id);
          if (chargeRefunds && chargeRefunds.length > 0) {
            customer.reembolsos += chargeRefunds.length;
            chargeRefunds.forEach((refund: { charge_id: string; amount: number }) => {
              customer.reembolsos_valor += refund.amount / 100;
            });
          }
        } else {
          console.log(`⚠️ Customer ${email} tem payment mas sem charges`);
        }
      } else {
        if (parseFloat(reg.amount_paid || 0) > 0) {
          console.log(`⚠️ Registro ${email} com valor R$ ${reg.amount_paid} mas sem stripe_payments`);
        }
      }
    });

    console.log(`👥 Grouped into ${customersMap.size} unique customers`);

    // Converter para array e filtrar por search e payment method
    let customers = Array.from(customersMap.values());
    
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.email.toLowerCase().includes(searchLower) || 
        c.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrar por forma de pagamento
    if (paymentMethodFilter) {
      if (paymentMethodFilter === 'voucher') {
        customers = customers.filter(c => !c.card_brand);
      } else {
        customers = customers.filter(c => c.card_brand && c.card_brand.toLowerCase() === paymentMethodFilter.toLowerCase());
      }
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
      
      // Determinar forma de pagamento:
      // 1. Se tem payment_intent e card_brand do Stripe → mostrar bandeira
      // 2. Se tem amount_paid > 0 mas sem payment_intent → Pagamento Manual
      // 3. Se curso = "Não especificado" ou amount_paid = 0 → Voucher/Gratuito
      let formaPagamento = 'Voucher/Gratuito';
      
      if (customer.card_brand && customer.registrations[0]?.stripe_payment_intent_id) {
        // Tem pagamento via Stripe com cartão
        formaPagamento = customer.card_brand.charAt(0).toUpperCase() + customer.card_brand.slice(1);
        if (customer.last4) {
          formaPagamento += ` ****${customer.last4}`;
        }
      } else if (customer.total_gasto > 0 && customer.curso !== 'Não especificado') {
        // Tem valor pago mas sem Stripe = pagamento manual/externo
        formaPagamento = 'Pagamento Manual';
      }
      
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
        forma_pagamento_padrao: formaPagamento,
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
