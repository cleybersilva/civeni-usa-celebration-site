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
    let code: string | null = null;

    // Support both GET with URL param and POST with body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      code = url.pathname.split('/').pop() || url.searchParams.get('code');
    } else if (req.method === 'POST') {
      const body = await req.json();
      code = body.code;
    }

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Código não fornecido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Verifying certificate with code:', code);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: certificate, error } = await supabase
      .from('issued_certificates')
      .select(`
        id,
        full_name,
        issued_at,
        event_id
      `)
      .eq('code', code)
      .single();

    if (error || !certificate) {
      console.log('Certificate not found or error:', error);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Certificado não encontrado ou inválido' 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Fetch event details separately
    let eventName = 'Evento CIVENI';
    if (certificate.event_id) {
      const { data: eventData } = await supabase
        .from('events')
        .select('slug')
        .eq('id', certificate.event_id)
        .single();
      
      if (eventData?.slug) {
        eventName = eventData.slug;
      }
    }

    console.log('Certificate found:', certificate);

    return new Response(
      JSON.stringify({ 
        valid: true,
        message: 'Certificado válido e autêntico',
        holderName: certificate.full_name,
        eventSlug: eventName,
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