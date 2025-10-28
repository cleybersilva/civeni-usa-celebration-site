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
    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email não fornecido');
    }

    console.log(`🗑️ Excluindo duplicados de: ${email}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar todos os registros
    const { data: registros, error: erroSelect } = await supabase
      .from('event_registrations')
      .select('id, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (erroSelect) throw erroSelect;

    console.log(`📊 Encontrados ${registros?.length || 0} registros`);

    if (!registros || registros.length <= 1) {
      return new Response(JSON.stringify({
        success: true,
        deleted_count: 0,
        message: 'Nenhum duplicado encontrado'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Manter o primeiro (mais recente) e deletar o resto
    const idsParaDeletar = registros.slice(1).map(r => r.id);
    
    console.log(`🗑️ Deletando ${idsParaDeletar.length} registros`);

    const { error: erroDelete } = await supabase
      .from('event_registrations')
      .delete()
      .in('id', idsParaDeletar);

    if (erroDelete) throw erroDelete;

    console.log(`✅ Sucesso! Deletados ${idsParaDeletar.length} registros`);

    return new Response(JSON.stringify({
      success: true,
      deleted_count: idsParaDeletar.length,
      message: `${idsParaDeletar.length} duplicados removidos`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
