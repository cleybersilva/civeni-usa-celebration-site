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
    if (!eventId || !email || !fullName || !keywords || keywords.length !== 5) {
      return new Response(
        JSON.stringify({ success: false, message: 'Dados inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFullName = fullName.trim().slice(0, 50);

    if (normalizedFullName.length < 2) {
      return new Response(
        JSON.stringify({ success: false, message: 'Nome deve ter pelo menos 2 caracteres' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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
        JSON.stringify({ success: false, message: 'Muitas tentativas. Tente novamente em 1 hora.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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
      .single();

    if (eventError || !eventCert) {
      return new Response(
        JSON.stringify({ success: false, message: 'Evento não encontrado ou certificados não habilitados' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if user is registered for the event
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .select('id, full_name, payment_status')
      .eq('event_id', eventId)
      .eq('email', normalizedEmail)
      .single();

    if (regError || !registration) {
      await supabase.from('certificate_attempts').insert({
        event_id: eventId,
        email: normalizedEmail,
        ip: clientIP,
        matched: 0
      });

      return new Response(
        JSON.stringify({ success: false, message: 'Email não encontrado nas inscrições deste evento' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if payment is confirmed (if required)
    if (registration.payment_status && registration.payment_status !== 'completed') {
      return new Response(
        JSON.stringify({ success: false, message: 'Pagamento não confirmado' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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
          message: `Você acertou ${matchedCount}/${eventCert.keywords.length} palavras-chave. Mínimo: ${eventCert.required_correct}/${eventCert.keywords.length}`,
          matched: matchedCount 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('issued_certificates')
      .select('code, pdf_url, issued_at')
      .eq('event_id', eventId)
      .eq('email', normalizedEmail)
      .single();

    if (existingCert) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Certificado já emitido em ${new Date(existingCert.issued_at).toLocaleDateString('pt-BR')}`,
          pdfUrl: existingCert.pdf_url,
          code: existingCert.code
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Generate certificate
    const code = generateCode();
    const issueDate = new Date();
    
    // Get event details for certificate
    const { data: event } = await supabase
      .from('events')
      .select('slug')
      .eq('id', eventId)
      .single();

    // For now, we'll create a simple PDF URL (in production, you'd generate actual PDF)
    const pdfUrl = `https://wdkeqxfglmritghmakma.supabase.co/storage/v1/object/public/certificates/${eventId}/${code}.pdf`;

    // Save certificate record
    const { error: saveError } = await supabase
      .from('issued_certificates')
      .insert({
        event_id: eventId,
        registration_id: registration.id,
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Certificado emitido com sucesso!',
        pdfUrl: pdfUrl,
        code: code
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