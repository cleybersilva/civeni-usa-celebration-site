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

    console.log(`🔀 Finance funnel requested: from=${from}, to=${to}`);

    // Query registrations for accurate funnel
    let registrationsQuery = supabaseClient
      .from('event_registrations')
      .select('payment_status', { count: 'exact' });

    if (from) {
      registrationsQuery = registrationsQuery.gte('created_at', from);
    }
    if (to) {
      registrationsQuery = registrationsQuery.lte('created_at', to);
    }

    const { data: registrations, count: totalRegistrations } = await registrationsQuery;

    // Count by status
    const initiated = registrations?.filter(r => 
      ['pending', 'started', 'processing'].includes(r.payment_status)
    ).length || 0;
    
    const completed = registrations?.filter(r => 
      r.payment_status === 'completed'
    ).length || 0;

    const total = totalRegistrations || 0;
    const taxaConversao = total > 0 
      ? ((completed / total) * 100).toFixed(2) 
      : '0.00';

    const funnel = {
      total_sessions: total,
      total_intents: initiated + completed,
      charges_succeeded: completed,
      taxa_conversao: parseFloat(taxaConversao),
      steps: [
        { step: 'Checkout Iniciado', count: total, percentage: 100 },
        { 
          step: 'Pagamento Criado', 
          count: initiated + completed, 
          percentage: total > 0 ? (((initiated + completed) / total) * 100).toFixed(1) : '0' 
        },
        { 
          step: 'Pagamento Confirmado', 
          count: completed, 
          percentage: total > 0 ? ((completed / total) * 100).toFixed(1) : '0' 
        }
      ]
    };

    return new Response(JSON.stringify(funnel), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error fetching funnel:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
