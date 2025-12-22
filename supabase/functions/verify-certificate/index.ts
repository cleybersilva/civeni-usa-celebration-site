import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Caracteres comumente confundidos
const SIMILAR_CHARS: Record<string, string[]> = {
  'V': ['W', 'U'],
  'W': ['V', 'VV'],
  '0': ['O', 'Q'],
  'O': ['0', 'Q'],
  '1': ['I', 'L', 'l'],
  'I': ['1', 'L', 'l'],
  'L': ['1', 'I', 'l'],
  'l': ['1', 'I', 'L'],
  '8': ['B'],
  'B': ['8'],
  '5': ['S'],
  'S': ['5'],
  '6': ['G'],
  'G': ['6'],
};

// Gera variações do código substituindo caracteres similares
function generateSimilarCodes(code: string): string[] {
  const variations: Set<string> = new Set();
  const upperCode = code.toUpperCase();
  
  // Gera variações substituindo um caractere por vez
  for (let i = 0; i < upperCode.length; i++) {
    const char = upperCode[i];
    const similarChars = SIMILAR_CHARS[char];
    
    if (similarChars) {
      for (const similar of similarChars) {
        const variation = upperCode.slice(0, i) + similar + upperCode.slice(i + 1);
        variations.add(variation);
      }
    }
  }
  
  return Array.from(variations);
}

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
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Verifying certificate with code:', code);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Normaliza o código para busca case-insensitive
    const normalizedCode = code.trim();

    // Primeiro tenta busca exata (case-insensitive usando ILIKE)
    const { data: certificate, error } = await supabase
      .from('issued_certificates')
      .select(`
        id,
        code,
        full_name,
        issued_at,
        event_id
      `)
      .ilike('code', normalizedCode)
      .single();

    if (error || !certificate) {
      console.log('Exact match not found, trying similar codes...');
      
      // Se não encontrou, tenta buscar códigos similares
      const similarCodes = generateSimilarCodes(normalizedCode);
      console.log('Generated similar codes:', similarCodes);
      
      if (similarCodes.length > 0) {
        // Busca por códigos similares
        const { data: similarCertificates } = await supabase
          .from('issued_certificates')
          .select('code')
          .or(similarCodes.map(c => `code.ilike.${c}`).join(','))
          .limit(1);
        
        if (similarCertificates && similarCertificates.length > 0) {
          const suggestedCode = similarCertificates[0].code;
          console.log('Found similar certificate with code:', suggestedCode);
          
          return new Response(
            JSON.stringify({ 
              valid: false, 
              message: 'Certificado não encontrado com este código exato.',
              suggestion: 'Você quis dizer:',
              suggestedCode: suggestedCode
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }
      
      console.log('Certificate not found and no similar codes match');
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Certificado não encontrado ou inválido' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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