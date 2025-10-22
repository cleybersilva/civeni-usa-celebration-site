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

    // Query funnel
    let sessionQuery = supabaseClient.from('stripe_checkout_sessions').select('id', { count: 'exact', head: true });
    let intentQuery = supabaseClient.from('stripe_payment_intents').select('id', { count: 'exact', head: true });
    let chargeQuery = supabaseClient
      .from('stripe_charges')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'succeeded')
      .eq('paid', true);

    if (from) {
      sessionQuery = sessionQuery.gte('created_utc', from);
      intentQuery = intentQuery.gte('created_utc', from);
      chargeQuery = chargeQuery.gte('created_utc', from);
    }
    if (to) {
      sessionQuery = sessionQuery.lte('created_utc', to);
      intentQuery = intentQuery.lte('created_utc', to);
      chargeQuery = chargeQuery.lte('created_utc', to);
    }

    const [sessionsResult, intentsResult, chargesResult] = await Promise.all([
      sessionQuery,
      intentQuery,
      chargeQuery
    ]);

    const totalSessions = sessionsResult.count || 0;
    const totalIntents = intentsResult.count || 0;
    const chargesSucceeded = chargesResult.count || 0;

    const taxaConversao = totalSessions > 0 
      ? ((chargesSucceeded / totalSessions) * 100).toFixed(2) 
      : '0.00';

    const funnel = {
      total_sessions: totalSessions,
      total_intents: totalIntents,
      charges_succeeded: chargesSucceeded,
      taxa_conversao: parseFloat(taxaConversao),
      steps: [
        { step: 'Checkout Iniciado', count: totalSessions, percentage: 100 },
        { 
          step: 'Pagamento Criado', 
          count: totalIntents, 
          percentage: totalSessions > 0 ? ((totalIntents / totalSessions) * 100).toFixed(1) : '0' 
        },
        { 
          step: 'Pagamento Confirmado', 
          count: chargesSucceeded, 
          percentage: totalSessions > 0 ? ((chargesSucceeded / totalSessions) * 100).toFixed(1) : '0' 
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
