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
    const range = url.searchParams.get('range') || '30d';

    // Calcular data de início baseado no range
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

    // Total de inscrições
    const { count: total_inscricoes, error: regError } = await supabaseClient
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    if (regError) throw regError;

    // Pagamentos confirmados
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('stripe_payments')
      .select('amount_gross_cents, amount_net_cents')
      .in('status', ['succeeded', 'paid', 'completed'])
      .gte('occurred_at', startDate.toISOString());

    if (paymentsError) throw paymentsError;

    const pagamentos_confirmados = payments?.length || 0;
    const receita_gross = payments?.reduce((sum, p) => sum + (p.amount_gross_cents || 0), 0) || 0;
    const receita_net = payments?.reduce((sum, p) => sum + (p.amount_net_cents || 0), 0) || 0;

    // Taxa de conversão
    const { data: regsByStatus } = await supabaseClient
      .from('event_registrations')
      .select('payment_status')
      .gte('created_at', startDate.toISOString());

    const started_or_submitted = regsByStatus?.filter(r => 
      ['pending', 'started'].includes(r.payment_status)
    ).length || 0;
    
    const paid = regsByStatus?.filter(r => r.payment_status === 'completed').length || 0;
    
    const taxa_conversao = (started_or_submitted + paid) > 0 
      ? paid / (started_or_submitted + paid) 
      : 0;

    const kpis = {
      total_inscricoes: total_inscricoes || 0,
      pagamentos_confirmados,
      receita_gross,
      receita_net,
      taxa_conversao,
      moeda: 'BRL',
      atualizado_em: new Date().toISOString()
    };

    return new Response(JSON.stringify(kpis), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});