import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

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

const createCertificatePdf = async (
  options: CertificatePdfOptions,
): Promise<Uint8Array> => {
  const { fullName, eventSlug, language, issueDate, city, country, hours, code } = options;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const titleText =
    language === "en-US"
      ? "Certificate of Participation"
      : language === "es-ES"
      ? "Certificado de Participación"
      : "Certificado de Participação";

  page.drawText(titleText, {
    x: 50,
    y: height - 80,
    size: 24,
    font: titleFont,
    color: rgb(0.1, 0.2, 0.5),
  });

  const nameLabelText =
    language === "en-US"
      ? "We hereby certify that"
      : language === "es-ES"
      ? "Certificamos que"
      : "Certificamos que";

  page.drawText(nameLabelText, {
    x: 50,
    y: height - 140,
    size: 14,
    font: textFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  const nameSize = 32;
  const nameWidth = titleFont.widthOfTextAtSize(fullName, nameSize);
  page.drawText(fullName, {
    x: (width - nameWidth) / 2,
    y: height - 190,
    size: nameSize,
    font: titleFont,
    color: rgb(0, 0, 0),
  });

  const eventLine =
    language === "en-US"
      ? `for participating in the event ${eventSlug}.`
      : language === "es-ES"
      ? `por participar del evento ${eventSlug}.`
      : `por participar do evento ${eventSlug}.`;

  page.drawText(eventLine, {
    x: 50,
    y: height - 230,
    size: 14,
    font: textFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  let y = height - 260;
  if (hours) {
    const hoursText =
      language === "en-US"
        ? `Workload: ${hours} hours`
        : language === "es-ES"
        ? `Carga horaria: ${hours} horas`
        : `Carga horária: ${hours} horas`;

    page.drawText(hoursText, {
      x: 50,
      y,
      size: 12,
      font: textFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 20;
  }

  const locationParts: string[] = [];
  if (city) locationParts.push(city);
  if (country) locationParts.push(country);
  const locationBase = locationParts.join(" - ");

  const dateStr = issueDate.toLocaleDateString(
    language === "en-US" ? "en-US" : language === "es-ES" ? "es-ES" : "pt-BR",
  );

  const locationLine = locationBase ? `${locationBase}, ${dateStr}` : dateStr;

  page.drawText(locationLine, {
    x: 50,
    y,
    size: 12,
    font: textFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  const codeLabel =
    language === "en-US"
      ? "Verification code:"
      : language === "es-ES"
      ? "Código de verificación:"
      : "Código de verificação:";

  page.drawText(codeLabel, {
    x: 50,
    y: 80,
    size: 10,
    font: textFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  page.drawText(code, {
    x: 50,
    y: 65,
    size: 14,
    font: titleFont,
    color: rgb(0.1, 0.2, 0.5),
  });

  return await pdfDoc.save();
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

    // Buscar configuração do evento e idioma
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
      return new Response(
        JSON.stringify({
          success: false,
          message: "Evento não encontrado ou certificados não habilitados",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

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

    // Detalhes do evento para o certificado
    const { data: event } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .single();

    // Verificar se certificado já existe para este e-mail/evento
    const { data: existingCert } = await supabase
      .from("issued_certificates")
      .select("id, code, pdf_url, issued_at")
      .eq("event_id", eventId)
      .eq("email", normalizedEmail)
      .maybeSingle();

    const code = existingCert?.code || generateCode();
    const issueDate = existingCert?.issued_at ? new Date(existingCert.issued_at) : new Date();

    // Gerar PDF e enviar para o Storage
    const pdfBytes = await createCertificatePdf({
      fullName: normalizedFullName,
      eventSlug: event?.slug || "CIVENI 2025",
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
          eventName: event?.slug || "CIVENI 2025",
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
        eventName: event?.slug || "CIVENI 2025",
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
