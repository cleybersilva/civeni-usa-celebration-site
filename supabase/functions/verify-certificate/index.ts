import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.pathname.split('/').pop();

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Código não fornecido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: certificate, error } = await supabase
      .from('issued_certificates')
      .select(`
        id,
        full_name,
        issued_at,
        events(slug)
      `)
      .eq('code', code)
      .single();

    if (error || !certificate) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Certificado não encontrado ou inválido' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        message: 'Certificado válido',
        holderName: certificate.full_name,
        eventSlug: (certificate.events as any)?.slug || 'evento',
        issuedAt: certificate.issued_at
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in verify-certificate function:', error);
    return new Response(
      JSON.stringify({ valid: false, message: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);