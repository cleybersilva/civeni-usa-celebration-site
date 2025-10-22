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
    const metric = url.searchParams.get('metric') || 'inscricoes';
    const interval = url.searchParams.get('interval') || 'day';
    const range = url.searchParams.get('range') || '7d';

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
    }

    let seriesData: any[] = [];

    if (metric === 'inscricoes') {
      // Usar MV para dados diários
      if (interval === 'day') {
        const { data, error } = await supabaseClient
          .from('mv_registrations_daily')
          .select('day, paid, started_or_submitted')
          .gte('day', startDate.toISOString())
          .order('day', { ascending: true });

        if (error) throw error;

        seriesData = data?.map(d => ({
          date: d.day,
          value: d.paid + d.started_or_submitted,
          paid: d.paid,
          pending: d.started_or_submitted
        })) || [];
      } else {
        // Agregar por hora (fazer CTE em tempo real)
        const { data, error } = await supabaseClient.rpc('get_hourly_registrations', {
          start_date: startDate.toISOString()
        });

        if (error) {
          // Fallback para agregação manual se RPC não existir
          const { data: regs, error: regError } = await supabaseClient
            .from('event_registrations')
            .select('created_at, payment_status')
            .gte('created_at', startDate.toISOString());

          if (regError) throw regError;

          // Agregar manualmente por hora
          const hourlyMap = new Map<string, any>();
          regs?.forEach(reg => {
            const hour = new Date(reg.created_at);
            hour.setMinutes(0, 0, 0);
            const key = hour.toISOString();
            
            if (!hourlyMap.has(key)) {
              hourlyMap.set(key, { date: key, value: 0, paid: 0, pending: 0 });
            }
            
            const item = hourlyMap.get(key)!;
            item.value++;
            if (reg.payment_status === 'completed') item.paid++;
            else item.pending++;
          });

          seriesData = Array.from(hourlyMap.values()).sort((a, b) => 
            a.date.localeCompare(b.date)
          );
        } else {
          seriesData = data || [];
        }
      }
    } else if (metric === 'revenue_gross' || metric === 'revenue_net') {
      // Usar MV para receita
      const { data, error } = await supabaseClient
        .from('mv_revenue_daily')
        .select('day, gross_cents, net_cents')
        .gte('day', startDate.toISOString())
        .order('day', { ascending: true });

      if (error) throw error;

      seriesData = data?.map(d => ({
        date: d.day,
        value: metric === 'revenue_gross' ? d.gross_cents / 100 : d.net_cents / 100
      })) || [];
    } else if (metric === 'conversion') {
      const { data, error } = await supabaseClient
        .from('mv_conversion')
        .select('day, conversion_ratio')
        .gte('day', startDate.toISOString())
        .order('day', { ascending: true });

      if (error) throw error;

      seriesData = data?.map(d => ({
        date: d.day,
        value: d.conversion_ratio
      })) || [];
    }

    return new Response(JSON.stringify({ metric, interval, range, data: seriesData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching series:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});