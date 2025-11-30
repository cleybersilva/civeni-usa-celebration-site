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

    // Buscar todas as inscrições pagas
    const { data: registrations, error: regError } = await supabaseClient
      .from('event_registrations')
      .select('batch_id, payment_status')
      .eq('payment_status', 'completed');

    if (regError) {
      console.error('❌ Erro ao buscar inscrições:', regError);
      throw regError;
    }

    console.log(`✅ Encontradas ${registrations?.length || 0} inscrições pagas`);

    // Contar inscrições por lote
    const countByLote: Record<string, number> = {};
    (registrations || []).forEach((reg: any) => {
      if (reg.batch_id) {
        countByLote[reg.batch_id] = (countByLote[reg.batch_id] || 0) + 1;
      }
    });

    console.log('📊 Contagem por batch_id:', countByLote);

    // Montar dados para retorno
    const lotesComQtd = (lotes || []).map(lote => ({
      id: lote.id,
      nome: lote.nome,
      quantidade: countByLote[lote.id] || 0,
      price_cents: lote.price_cents,
      dt_inicio: lote.dt_inicio,
      dt_fim: lote.dt_fim
    }));

    const total = lotesComQtd.reduce((sum, l) => sum + l.quantidade, 0);
    console.log(`📊 Total de inscrições: ${total}`);

    return new Response(JSON.stringify({ 
      lotes: lotesComQtd,
      total
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
