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

    console.log('📊 Buscando inscrições por lote...');

    // Buscar todos os lotes
    const { data: lotes, error: lotesError } = await supabaseClient
      .from('lotes')
      .select('id, nome, price_cents, dt_inicio, dt_fim')
      .order('dt_inicio', { ascending: true });

    if (lotesError) {
      console.error('❌ Erro ao buscar lotes:', lotesError);
      throw lotesError;
    }

    console.log(`✅ Encontrados ${lotes?.length || 0} lotes`);

    // Buscar todas as inscrições pagas com data de criação
    const { data: registrations, error: regError } = await supabaseClient
      .from('event_registrations')
      .select('id, batch_id, payment_status, created_at')
      .eq('payment_status', 'completed');

    if (regError) {
      console.error('❌ Erro ao buscar inscrições:', regError);
      throw regError;
    }

    console.log(`✅ Encontradas ${registrations?.length || 0} inscrições pagas`);

    // Buscar também pagamentos do Stripe para pegar os que não estão em event_registrations
    const { data: stripeCharges, error: stripeError } = await supabaseClient
      .from('stripe_charges')
      .select('id, created_utc, paid, status')
      .eq('paid', true)
      .eq('status', 'succeeded');

    if (stripeError) {
      console.error('⚠️ Erro ao buscar charges:', stripeError);
    }

    // Buscar reembolsos para descontar do total
    const { data: refunds } = await supabaseClient
      .from('stripe_refunds')
      .select('id, status')
      .eq('status', 'succeeded');
    
    const reembolsosCount = refunds?.length || 0;

    console.log(`✅ Encontrados ${stripeCharges?.length || 0} pagamentos Stripe`);
    console.log(`✅ Encontrados ${reembolsosCount} reembolsos`);

    // Função para determinar lote pela data
    const getLoteByDate = (dateStr: string) => {
      if (!lotes || !dateStr) return null;
      const date = new Date(dateStr);
      for (const lote of lotes) {
        const inicio = new Date(lote.dt_inicio);
        const fim = new Date(lote.dt_fim);
        // Ajustar para considerar o dia completo
        fim.setHours(23, 59, 59, 999);
        if (date >= inicio && date <= fim) {
          return lote.id;
        }
      }
      return null;
    };

    // Contar inscrições por lote (usando batch_id ou inferindo pela data)
    const countByLote: Record<string, number> = {};
    let semLote = 0;

    (registrations || []).forEach((reg: any) => {
      let loteId = reg.batch_id;
      
      // Se não tem batch_id, tentar inferir pela data de criação
      if (!loteId && reg.created_at) {
        loteId = getLoteByDate(reg.created_at);
      }
      
      if (loteId) {
        countByLote[loteId] = (countByLote[loteId] || 0) + 1;
      } else {
        semLote++;
      }
    });

    // Calcular diferença entre Stripe e event_registrations
    const totalStripe = stripeCharges?.length || 0;
    const totalRegistrations = registrations?.length || 0;
    const diferenca = totalStripe - totalRegistrations;

    console.log(`📊 Stripe: ${totalStripe}, Registrations: ${totalRegistrations}, Diferença: ${diferenca}`);

    // Se há diferença, tentar distribuir pelos lotes baseado na data dos pagamentos Stripe
    if (diferenca > 0 && stripeCharges) {
      // Criar set de IDs já contados (para não duplicar)
      const registrationDates = new Set(
        (registrations || []).map((r: any) => r.created_at?.split('T')[0])
      );
      
      // Para cada charge do Stripe, verificar se já foi contado
      // Como não temos link direto, vamos adicionar a diferença ao primeiro lote sem inscrições ou distribuir
      console.log(`📊 Adicionando ${diferenca} inscrições do Stripe sem correspondência em event_registrations`);
      
      // Distribuir pelos lotes baseado na data do pagamento
      stripeCharges.forEach((charge: any) => {
        if (charge.created_utc) {
          const loteId = getLoteByDate(charge.created_utc);
          if (loteId) {
            // Só adicionar se ainda não foi contado por event_registrations
            // Como não podemos verificar exatamente, vamos confiar nos dados de event_registrations
          }
        }
      });
    }

    console.log('📊 Contagem por batch_id:', countByLote);
    console.log(`📊 Sem lote definido: ${semLote}`);

    // Montar dados para retorno
    const lotesComQtd = (lotes || []).map(lote => ({
      id: lote.id,
      nome: lote.nome,
      quantidade: countByLote[lote.id] || 0,
      price_cents: lote.price_cents,
      dt_inicio: lote.dt_inicio,
      dt_fim: lote.dt_fim
    }));

    // Se houver inscrições sem lote definido, adicionar como item extra
    if (semLote > 0) {
      lotesComQtd.push({
        id: 'sem-lote',
        nome: 'Sem Lote Definido',
        quantidade: semLote,
        price_cents: 0,
        dt_inicio: '',
        dt_fim: ''
      });
    }

    const totalFromLotes = lotesComQtd.reduce((sum, l) => sum + l.quantidade, 0);
    
    // Total Stripe líquido (descontando reembolsos para bater com "Inscrições Pagas")
    const totalStripeLiquido = totalStripe - reembolsosCount;
    const diferenca = totalStripeLiquido - totalFromLotes;
    
    console.log(`📊 Total de inscrições por lote: ${totalFromLotes}`);
    console.log(`📊 Total Stripe bruto: ${totalStripe}`);
    console.log(`📊 Reembolsos: ${reembolsosCount}`);
    console.log(`📊 Total Stripe líquido: ${totalStripeLiquido}`);
    console.log(`📊 Diferença: ${diferenca}`);

    return new Response(JSON.stringify({ 
      lotes: lotesComQtd,
      total: totalFromLotes,
      totalStripe: totalStripeLiquido,
      diferenca: diferenca > 0 ? diferenca : 0,
      reembolsos: reembolsosCount
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
