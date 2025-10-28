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

    // Verificar autenticação do usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    // Verificar se o usuário é admin root
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se o usuário é admin root
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('user_type')
      .eq('email', user.email)
      .single();

    if (adminError || !adminUser || adminUser.user_type !== 'admin_root') {
      throw new Error('Permissão negada - apenas admin root pode excluir registros');
    }

    // Obter o email do cliente a ser excluído
    const { email } = await req.json();
    
    if (!email) {
      throw new Error('Email não fornecido');
    }

    console.log(`🗑️ Admin ${user.email} solicitou exclusão de registros duplicados de: ${email}`);

    // Buscar todos os registros deste email
    const { data: allRegistrations, error: fetchError } = await supabaseClient
      .from('event_registrations')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erro ao buscar registros:', fetchError);
      throw fetchError;
    }

    if (!allRegistrations || allRegistrations.length <= 1) {
      return new Response(JSON.stringify({
        success: true,
        deleted_count: 0,
        message: 'Nenhum registro duplicado encontrado para excluir'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Manter apenas o registro mais recente (primeiro da lista) e excluir os demais
    const registrationToKeep = allRegistrations[0];
    const registrationsToDelete = allRegistrations.slice(1);

    console.log(`📊 Total de registros: ${allRegistrations.length}`);
    console.log(`✅ Mantendo registro mais recente: ${registrationToKeep.id}`);
    console.log(`🗑️ Excluindo ${registrationsToDelete.length} registro(s) duplicado(s)`);

    // Excluir os registros duplicados
    const idsToDelete = registrationsToDelete.map(r => r.id);
    
    const { data, error } = await supabaseClient
      .from('event_registrations')
      .delete()
      .in('id', idsToDelete)
      .select();

    if (error) {
      console.error('❌ Erro ao excluir:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} registro(s) duplicado(s) excluídos com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      deleted_count: data?.length || 0,
      message: `${data?.length || 0} registro(s) excluídos com sucesso`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erro na exclusão:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
