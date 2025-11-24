import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateRequest {
  eventId: string;
  email: string;
  fullName: string;
  keywords: string[];
}

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .trim();
};

const generateCode = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventId, email, fullName, keywords }: CertificateRequest = await req.json();

    // Validate input
    if (!eventId || !email || !fullName || !keywords || keywords.length !== 3) {
      return new Response(
        JSON.stringify({ success: false, message: msg.invalidData }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFullName = fullName.trim().slice(0, 50);

    if (normalizedFullName.length < 2) {
      return new Response(
        JSON.stringify({ success: false, message: msg.nameMin }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Rate limit check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: attempts } = await supabase
      .from('certificate_attempts')
      .select('id')
      .eq('email', normalizedEmail)
      .gte('created_at', oneHourAgo.toISOString());

    if (attempts && attempts.length >= 5) {
      return new Response(
        JSON.stringify({ success: false, message: msg.tooManyAttempts }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if event exists and has certificates enabled
    const { data: eventCert, error: eventError } = await supabase
      .from('event_certificates')
      .select(`
        *,
        events!inner(id, slug, status_publicacao)
      `)
      .eq('event_id', eventId)
      .eq('is_enabled', true)
      .eq('events.status_publicacao', 'published')
      .maybeSingle();

    if (eventError || !eventCert) {
      return new Response(
        JSON.stringify({ success: false, message: 'Evento não encontrado ou certificados não habilitados' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get language-specific messages
    const language = eventCert.language || 'pt-BR';
    const messages = {
      'pt-BR': {
        invalidData: 'Dados inválidos. É necessário fornecer 3 palavras-chave.',
        nameMin: 'Nome deve ter pelo menos 2 caracteres',
        tooManyAttempts: 'Muitas tentativas. Tente novamente em 1 hora.',
        eventNotFound: 'Evento não encontrado ou certificados não habilitados',
        keywordsMismatch: (matched: number, required: number) => 
          `Você acertou ${matched}/3 palavras-chave. Mínimo necessário: ${required}/3`,
        alreadyIssued: (date: string) => `Certificado já emitido em ${date}`,
        success: 'Certificado emitido com sucesso!'
      },
      'en-US': {
        invalidData: 'Invalid data. 3 keywords are required.',
        nameMin: 'Name must be at least 2 characters',
        tooManyAttempts: 'Too many attempts. Try again in 1 hour.',
        eventNotFound: 'Event not found or certificates not enabled',
        keywordsMismatch: (matched: number, required: number) => 
          `You got ${matched}/3 keywords correct. Minimum required: ${required}/3`,
        alreadyIssued: (date: string) => `Certificate already issued on ${date}`,
        success: 'Certificate issued successfully!'
      },
      'es-ES': {
        invalidData: 'Datos inválidos. Se requieren 3 palabras clave.',
        nameMin: 'El nombre debe tener al menos 2 caracteres',
        tooManyAttempts: 'Demasiados intentos. Inténtelo de nuevo en 1 hora.',
        eventNotFound: 'Evento no encontrado o certificados no habilitados',
        keywordsMismatch: (matched: number, required: number) => 
          `Acertó ${matched}/3 palabras clave. Mínimo requerido: ${required}/3`,
        alreadyIssued: (date: string) => `Certificado ya emitido el ${date}`,
        success: '¡Certificado emitido con éxito!'
      }
    };

    const msg = messages[language as keyof typeof messages] || messages['pt-BR'];

    // Check keywords
    const normalizedUserKeywords = keywords.map(normalizeText);
    const normalizedOfficialKeywords = eventCert.keywords.map(normalizeText);
    
    const matchedCount = normalizedUserKeywords.filter(userKw => 
      normalizedOfficialKeywords.includes(userKw) && userKw.length > 0
    ).length;

    // Log attempt
    await supabase.from('certificate_attempts').insert({
      event_id: eventId,
      email: normalizedEmail,
      ip: clientIP,
      matched: matchedCount
    });

    if (matchedCount < eventCert.required_correct) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: msg.keywordsMismatch(matchedCount, eventCert.required_correct),
          matched: matchedCount 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get event details for certificate (antes de verificar se já existe)
    const { data: event } = await supabase
      .from('events')
      .select('slug')
      .eq('id', eventId)
      .single();

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('issued_certificates')
      .select('code, pdf_url, issued_at')
      .eq('event_id', eventId)
      .eq('email', normalizedEmail)
      .single();

    if (existingCert) {
      const issuedDate = new Date(existingCert.issued_at).toLocaleDateString(
        language === 'en-US' ? 'en-US' : language === 'es-ES' ? 'es-ES' : 'pt-BR'
      );
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: msg.alreadyIssued(issuedDate),
          pdfUrl: existingCert.pdf_url,
          code: existingCert.code,
          matched: matchedCount,
          fullName: normalizedFullName,
          email: normalizedEmail,
          eventName: event?.slug || 'CIVENI 2025'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate certificate
    const code = generateCode();
    const issueDate = new Date();

    // For now, we'll create a simple PDF URL (in production, you'd generate actual PDF)
    const pdfUrl = `https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/certificates/${eventId}/${code}.pdf`;

    // Save certificate record
    const { error: saveError } = await supabase
      .from('issued_certificates')
      .insert({
        event_id: eventId,
        registration_id: null,
        email: normalizedEmail,
        full_name: normalizedFullName,
        code: code,
        pdf_url: pdfUrl,
        keywords_matched: matchedCount,
        keywords_provided: keywords.map(k => k.trim())
      });

    if (saveError) {
      console.error('Error saving certificate:', saveError);
      return new Response(
        JSON.stringify({ success: false, message: 'Erro interno do servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Enviar e-mail automático com o certificado
    try {
      await supabase.functions.invoke('send-certificate-email', {
        body: {
          email: normalizedEmail,
          fullName: normalizedFullName,
          eventName: event?.slug || 'CIVENI 2025',
          pdfUrl: pdfUrl,
          code: code
        }
      });
      console.log('Email de certificado enviado para:', normalizedEmail);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail (não crítico):', emailError);
      // Não falhar a requisição se o e-mail falhar
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: msg.success,
        pdfUrl: pdfUrl,
        code: code,
        matched: matchedCount,
        fullName: normalizedFullName,
        email: normalizedEmail,
        eventName: event?.slug || 'CIVENI 2025'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in issue-certificate function:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);