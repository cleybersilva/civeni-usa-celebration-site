import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CERTIFICATES_BUCKET = "certificates";

interface CertificateRequest {
  eventId: string;
  email: string;
  fullName: string;
  keywords: string[];
}

interface CertificatePdfOptions {
  fullName: string;
  eventSlug: string;
  language: string;
  issueDate: Date;
  city?: string | null;
  country?: string | null;
  hours?: string | null;
  code: string;
}

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .trim();
};

const generateCode = (): string => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper para converter hex para RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return { r, g, b };
}

// Helper para substituir placeholders
function replacePlaceholders(text: string, data: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Helper para quebrar texto em linhas
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Função para buscar template HTML do evento
async function getEventCertificateTemplate(supabaseClient: any, eventId: string) {
  const { data: eventCert, error: certError } = await supabaseClient
    .from("event_certificates")
    .select("template_id, language")
    .eq("event_id", eventId)
    .single();

  if (certError || !eventCert || !eventCert.template_id) {
    console.error("Event certificate config not found or no template_id:", certError);
    return null;
  }

  const { data: template, error: templateError } = await supabaseClient
    .from("certificate_templates")
    .select("body_html, base_colors, logo_url, background_url")
    .eq("id", eventCert.template_id)
    .single();

  if (templateError || !template) {
    console.error("Template not found:", templateError);
    return null;
  }

  return { template, language: eventCert.language };
}

// Converter HTML para PDF usando serviço externo (HTMLtoPDF API)
async function htmlToPdf(html: string): Promise<Uint8Array> {
  const HTMLTOPDF_API_KEY = Deno.env.get("HTMLTOPDF_API_KEY");
  
  if (!HTMLTOPDF_API_KEY) {
    console.error("HTMLTOPDF_API_KEY not configured, PDF generation will fail");
    throw new Error("HTMLTOPDF_API_KEY não configurada");
  }

  const response = await fetch("https://api.html2pdf.app/v1/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": HTMLTOPDF_API_KEY,
    },
    body: JSON.stringify({
      html,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("HTML to PDF conversion failed:", errorText);
    throw new Error(`Falha ao converter HTML para PDF: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Criar PDF do certificado usando template HTML
const createCertificatePdf = async (
  supabaseClient: any,
  options: CertificatePdfOptions & { eventName?: string },
): Promise<Uint8Array> => {
  const { fullName, eventSlug, language, issueDate, city, country, hours, code, eventName } = options;

  console.log("Fetching certificate template for event:", eventSlug);

  const templateData = await getEventCertificateTemplate(supabaseClient, eventSlug);

  if (!templateData || !templateData.template) {
    console.error("No template found, using fallback");
    throw new Error("Template de certificado não encontrado para este evento");
  }

  const { template } = templateData;

  // Preparar dados para substituição de placeholders
  const dateStr = issueDate.toLocaleDateString(
    language === "en-US" ? "en-US" : language === "es-ES" ? "es-ES" : "pt-BR",
  );

  const locationParts: string[] = [];
  if (city) locationParts.push(city);
  if (country) locationParts.push(country);
  const locationDate = locationParts.length > 0 
    ? `${locationParts.join(" - ")}, ${dateStr}`
    : dateStr;

  // Substituir todos os placeholders no body_html
  let bodyHtml = template.body_html
    .replace(/\{\{PARTICIPANT_NAME\}\}/g, fullName)
    .replace(/\{\{EVENT_NAME\}\}/g, eventName || eventSlug)
    .replace(/\{\{WORKLOAD_HOURS\}\}/g, hours || "20")
    .replace(/\{\{CITY\}\}/g, city || "")
    .replace(/\{\{COUNTRY\}\}/g, country || "")
    .replace(/\{\{EVENT_DATE\}\}/g, locationDate)
    .replace(/\{\{VERIFICATION_CODE\}\}/g, code);

  // Extrair cores do base_colors
  const colors = template.base_colors || {};

  // Montar HTML completo com CSS embutido
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 297mm;
      height: 210mm;
      margin: 0;
      padding: 0;
      font-family: 'Arial', 'Helvetica', sans-serif;
      background-color: ${colors.background || '#ffffff'};
      ${template.background_url ? `background-image: url('${template.background_url}'); background-size: cover; background-position: center;` : ''}
      position: relative;
    }
    ${bodyHtml.includes('<style>') ? '' : `
    .title { text-align: center; color: ${colors.primary || '#1e40af'}; font-size: 32pt; font-weight: bold; margin-bottom: 10mm; text-transform: uppercase; }
    .subtitle { text-align: center; color: ${colors.secondary || '#ef4444'}; font-size: 14pt; margin-bottom: 15mm; }
    .certify-text { text-align: center; color: ${colors.secondary || '#ef4444'}; font-size: 12pt; margin-bottom: 5mm; }
    .participant-name { text-align: center; font-size: 28pt; font-weight: bold; color: #000; margin: 10mm 0; }
    .main-text { text-align: center; font-size: 12pt; color: #000; line-height: 1.6; max-width: 80%; margin: 0 auto 15mm; }
    .location-date { text-align: center; font-size: 11pt; color: #000; margin-bottom: 10mm; }
    .signatures { display: flex; justify-content: space-around; margin-top: 15mm; }
    .signature { text-align: center; }
    .signature-line { border-top: 1px solid #000; margin-bottom: 3mm; padding-top: 2mm; width: 150px; margin: 0 auto; }
    .signature-name { font-weight: bold; font-size: 10pt; }
    .signature-title { font-size: 9pt; color: #666; }
    .verification-code { position: absolute; bottom: 5mm; left: 10mm; font-size: 8pt; color: #666; }
    .badge { position: absolute; bottom: 5mm; right: 10mm; padding: 3mm 6mm; background: ${colors.primary || '#1e40af'}; color: white; border-radius: 5mm; font-size: 9pt; font-weight: bold; }
    .border { position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 3px solid ${colors.primary || '#1e40af'}; pointer-events: none; }
    `}
  </style>
</head>
<body>
  <div class="border"></div>
  ${template.logo_url ? `<div class="logo" style="text-align: center; padding-top: 15mm;"><img src="${template.logo_url}" style="height: 15mm; width: auto;" /></div>` : ''}
  ${bodyHtml}
</body>
</html>
  `;

  console.log("Converting HTML to PDF...");
  
  return await htmlToPdf(html);
};

const uploadCertificatePdf = async (
  supabaseClient: any,
  pdfBytes: Uint8Array,
  eventId: string,
  code: string,
): Promise<{ pdfUrl: string }> => {
  const path = `${eventId}/${code}.pdf`;

  const { error: uploadError } = await supabaseClient.storage
    .from(CERTIFICATES_BUCKET)
    .upload(path, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading certificate PDF:", uploadError);
    throw uploadError;
  }

  const { data } = supabaseClient.storage.from(CERTIFICATES_BUCKET).getPublicUrl(path);
  return { pdfUrl: data.publicUrl };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { eventId, email, fullName, keywords }: CertificateRequest = await req.json();

    // Validação básica de entrada (mensagem fixa em PT para evitar depender de linguagem aqui)
    if (!eventId || !email || !fullName || !keywords || keywords.length !== 3) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Dados inválidos. É necessário fornecer 3 palavras-chave.",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Normalizar inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFullName = fullName.trim().slice(0, 50);

    // Checagem de rate limit
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data: attempts } = await supabase
      .from("certificate_attempts")
      .select("id")
      .eq("email", normalizedEmail)
      .gte("created_at", oneHourAgo.toISOString());

    if (attempts && attempts.length >= 5) {
      return new Response(
        JSON.stringify({ success: false, message: "Muitas tentativas. Tente novamente em 1 hora." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Buscar configuração do evento, idioma e layout_config
    const { data: eventCert, error: eventError } = await supabase
      .from("event_certificates")
      .select(
        `*,
         events!inner(id, slug, status_publicacao)
        `,
      )
      .eq("event_id", eventId)
      .eq("is_enabled", true)
      .eq("events.status_publicacao", "published")
      .maybeSingle();

    if (eventError || !eventCert) {
      console.error("Error fetching event certificate config:", eventError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Evento não encontrado ou certificados não habilitados",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log("Event certificate config found:", {
      event_id: eventId,
      has_layout_config: !!eventCert.layout_config,
      language: eventCert.language
    });

    // Mensagens por idioma
    const language = eventCert.language || "pt-BR";
    const messages = {
      "pt-BR": {
        invalidData: "Dados inválidos. É necessário fornecer 3 palavras-chave.",
        nameMin: "Nome deve ter pelo menos 2 caracteres",
        tooManyAttempts: "Muitas tentativas. Tente novamente em 1 hora.",
        eventNotFound: "Evento não encontrado ou certificados não habilitados",
        keywordsMismatch: (matched: number, required: number) =>
          `Você acertou ${matched}/3 palavras-chave. Mínimo necessário: ${required}/3`,
        alreadyIssued: (date: string) => `Certificado já emitido em ${date}`,
        success: "Certificado emitido com sucesso!",
      },
      "en-US": {
        invalidData: "Invalid data. 3 keywords are required.",
        nameMin: "Name must be at least 2 characters",
        tooManyAttempts: "Too many attempts. Try again in 1 hour.",
        eventNotFound: "Event not found or certificates not enabled",
        keywordsMismatch: (matched: number, required: number) =>
          `You got ${matched}/3 keywords correct. Minimum required: ${required}/3`,
        alreadyIssued: (date: string) => `Certificate already issued on ${date}`,
        success: "Certificate issued successfully!",
      },
      "es-ES": {
        invalidData: "Datos inválidos. Se requieren 3 palabras clave.",
        nameMin: "El nombre debe tener al menos 2 caracteres",
        tooManyAttempts: "Demasiados intentos. Inténtelo de nuevo en 1 hora.",
        eventNotFound: "Evento no encontrado o certificados no habilitados",
        keywordsMismatch: (matched: number, required: number) =>
          `Acertó ${matched}/3 palabras clave. Mínimo requerido: ${required}/3`,
        alreadyIssued: (date: string) => `Certificado ya emitido el ${date}`,
        success: "¡Certificado emitido con éxito!",
      },
    };

    const msg = messages[language as keyof typeof messages] || messages["pt-BR"];

    if (normalizedFullName.length < 2) {
      return new Response(
        JSON.stringify({ success: false, message: msg.nameMin }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Verificar palavras-chave
    const normalizedUserKeywords = keywords.map(normalizeText);
    const normalizedOfficialKeywords = eventCert.keywords.map(normalizeText);

    const matchedCount = normalizedUserKeywords.filter((userKw) =>
      normalizedOfficialKeywords.includes(userKw) && userKw.length > 0
    ).length;

    // Registrar tentativa
    await supabase.from("certificate_attempts").insert({
      event_id: eventId,
      email: normalizedEmail,
      ip: clientIP,
      matched: matchedCount,
    });

    if (matchedCount < eventCert.required_correct) {
      return new Response(
        JSON.stringify({
          success: false,
          message: msg.keywordsMismatch(matchedCount, eventCert.required_correct),
          matched: matchedCount,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Buscar detalhes do evento com traduções
    const { data: event } = await supabase
      .from("events")
      .select("slug, id")
      .eq("id", eventId)
      .single();

    // Buscar tradução do evento no idioma configurado
    const { data: translation } = await supabase
      .from("event_translations")
      .select("titulo")
      .eq("event_id", eventId)
      .eq("idioma", language)
      .maybeSingle();

    const eventName = translation?.titulo || event?.slug || "CIVENI 2025";
    console.log("Event name for certificate:", eventName);

    // Verificar se certificado já existe para este e-mail/evento
    const { data: existingCert } = await supabase
      .from("issued_certificates")
      .select("id, code, pdf_url, issued_at")
      .eq("event_id", eventId)
      .eq("email", normalizedEmail)
      .maybeSingle();

    const code = existingCert?.code || generateCode();
    const issueDate = existingCert?.issued_at ? new Date(existingCert.issued_at) : new Date();

    // Gerar PDF usando o template HTML completo do evento
    console.log("Generating PDF for event:", eventId);
    
    const pdfBytes = await createCertificatePdf(supabase, {
      fullName: normalizedFullName,
      eventSlug: eventId,
      eventName,
      language,
      issueDate,
      city: eventCert.city,
      country: eventCert.country,
      hours: eventCert.hours,
      code,
    });

    const { pdfUrl } = await uploadCertificatePdf(supabase, pdfBytes, eventId, code);

    // Inserir ou atualizar registro em issued_certificates
    let saveError;
    if (existingCert?.id) {
      const { error } = await supabase
        .from("issued_certificates")
        .update({
          pdf_url: pdfUrl,
          keywords_matched: matchedCount,
          keywords_provided: keywords.map((k) => k.trim()),
        })
        .eq("id", existingCert.id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from("issued_certificates")
        .insert({
          event_id: eventId,
          registration_id: null,
          email: normalizedEmail,
          full_name: normalizedFullName,
          code,
          pdf_url: pdfUrl,
          issued_at: issueDate.toISOString(),
          keywords_matched: matchedCount,
          keywords_provided: keywords.map((k) => k.trim()),
        });
      saveError = error;
    }

    if (saveError) {
      console.error("Error saving certificate:", saveError);
      return new Response(
        JSON.stringify({ success: false, message: "Erro interno do servidor" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Enviar e-mail automático com o certificado
    try {
      await supabase.functions.invoke("send-certificate-email", {
        body: {
          email: normalizedEmail,
          fullName: normalizedFullName,
          eventName,
          pdfUrl,
          code,
        },
      });
      console.log("Email de certificado enviado para:", normalizedEmail);
    } catch (emailError) {
      console.error("Erro ao enviar e-mail (não crítico):", emailError);
      // Não falhar a requisição se o e-mail falhar
    }

    const responseMessage = existingCert
      ? msg.alreadyIssued(
          issueDate.toLocaleDateString(
            language === "en-US" ? "en-US" : language === "es-ES" ? "es-ES" : "pt-BR",
          ),
        )
      : msg.success;

    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        pdfUrl,
        code,
        matched: matchedCount,
        fullName: normalizedFullName,
        email: normalizedEmail,
        eventName,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error in issue-certificate function:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Erro interno do servidor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
