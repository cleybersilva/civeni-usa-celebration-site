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

    // Query all registrations without date filter for accurate counts
    const { data: allRegistrations, error: regError } = await supabaseClient
      .from('event_registrations')
      .select('payment_status, created_at');

    if (regError) {
      console.error('❌ Error fetching registrations:', regError);
      throw regError;
    }

    // Filter by date in JavaScript if needed
    let filteredRegistrations = allRegistrations || [];
    
    if (from || to) {
      filteredRegistrations = filteredRegistrations.filter(r => {
        const createdAt = new Date(r.created_at);
        if (from && createdAt < new Date(from)) return false;
        if (to && createdAt > new Date(to)) return false;
        return true;
      });
    }

    console.log(`📊 Total registrations found: ${filteredRegistrations.length}`);

    // Count by status
    const pending = filteredRegistrations.filter(r => 
      ['pending', 'started'].includes(r.payment_status)
    ).length;
    
    const processing = filteredRegistrations.filter(r => 
      r.payment_status === 'processing'
    ).length;
    
    const completed = filteredRegistrations.filter(r => 
      r.payment_status === 'completed'
    ).length;

    const total = filteredRegistrations.length;
    const paymentCreated = pending + processing + completed;
    
    console.log(`📈 Funnel: Total=${total}, Created=${paymentCreated}, Completed=${completed}`);

    const taxaConversao = total > 0 
      ? ((completed / total) * 100).toFixed(2) 
      : '0.00';

    const funnel = {
      total_sessions: total,
      total_intents: paymentCreated,
      charges_succeeded: completed,
      taxa_conversao: parseFloat(taxaConversao),
      steps: [
        { step: 'Checkout Iniciado', count: total, percentage: 100 },
        { 
          step: 'Pagamento Criado', 
          count: paymentCreated, 
          percentage: total > 0 ? ((paymentCreated / total) * 100).toFixed(1) : '0' 
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
