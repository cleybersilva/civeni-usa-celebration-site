import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfigRequest {
  event_id: string;
  is_enabled: boolean;
  required_correct: number;
  keywords: string[];
  issuer_name: string;
  issuer_role: string;
  issuer_signature_url?: string;
  hours: string;
  city: string;
  country: string;
  timezone?: string;
  template_id?: string;
  layout_config?: any;
  language?: string;
  admin_email: string;
  session_token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: ConfigRequest = await req.json();
    const { admin_email, session_token, ...configData } = body;

    // Validate admin session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('email')
      .eq('email', admin_email)
      .eq('token', session_token)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, message: 'Sessão inválida ou expirada' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', admin_email)
      .single();

    if (adminError || !adminUser) {
      return new Response(
        JSON.stringify({ success: false, message: 'Usuário não autorizado' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', configData.event_id)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ success: false, message: 'Evento não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get existing config to preserve layout_config and language if not provided
    const { data: existingConfig } = await supabase
      .from('event_certificates')
      .select('layout_config, language')
      .eq('event_id', configData.event_id)
      .single();

    // Prepare data for upsert
    const dataToSave = {
      event_id: configData.event_id,
      is_enabled: configData.is_enabled ?? true,
      required_correct: configData.required_correct ?? 2,
      keywords: configData.keywords || [],
      issuer_name: configData.issuer_name || '',
      issuer_role: configData.issuer_role || '',
      issuer_signature_url: configData.issuer_signature_url || null,
      hours: configData.hours || '',
      city: configData.city || '',
      country: configData.country || '',
      timezone: configData.timezone || 'America/Sao_Paulo',
      template_id: configData.template_id || null,
      // Preserve existing layout_config and language if not provided in request
      layout_config: configData.layout_config !== undefined ? configData.layout_config : (existingConfig?.layout_config || null),
      language: configData.language || existingConfig?.language || 'pt-BR',
      updated_at: new Date().toISOString()
    };

    console.log('[save-certificate-config] Salvando:', dataToSave);

    // Upsert configuration using service role
    const { error: upsertError } = await supabase
      .from('event_certificates')
      .upsert(dataToSave, {
        onConflict: 'event_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('[save-certificate-config] Erro ao fazer upsert:', upsertError);
      return new Response(
        JSON.stringify({ success: false, message: upsertError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[save-certificate-config] Configuração salva com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Configurações salvas com sucesso!',
        data: dataToSave
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('[save-certificate-config] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
