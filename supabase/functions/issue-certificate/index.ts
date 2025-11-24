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

interface LayoutConfig {
  background?: {
    type: 'solid' | 'gradient';
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  border?: {
    enabled: boolean;
    thickness?: number;
    gradient?: {
      from: string;
      to: string;
    };
  };
  header?: {
    title: string;
    titleColor: string;
    subtitle: string;
    subtitleColor: string;
  };
  body?: {
    certifyLabel: string;
    certifyLabelColor: string;
    participantNamePlaceholder: string;
    participantNameStyle: {
      fontSize: number;
      color: string;
    };
    mainText: string;
    mainTextColor: string;
  };
  footer?: {
    locationDateText: string;
    locationDateColor: string;
    signatures?: Array<{
      label: string;
      name: string;
    }>;
  };
  badge?: {
    enabled: boolean;
    text: string;
    textColor: string;
  };
}

const createCertificatePdf = async (
  options: CertificatePdfOptions & { layoutConfig?: LayoutConfig; eventName?: string },
): Promise<Uint8Array> => {
  const { fullName, eventSlug, language, issueDate, city, country, hours, code, layoutConfig, eventName } = options;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Se temos layout_config, usar ele
  if (layoutConfig && layoutConfig.header && layoutConfig.body && layoutConfig.footer) {
    console.log("Using custom layout_config for PDF generation");
    
    // Preparar dados para substituição de placeholders
    const dateStr = issueDate.toLocaleDateString(
      language === "en-US" ? "en-US" : language === "es-ES" ? "es-ES" : "pt-BR",
    );
    const locationParts: string[] = [];
    if (city) locationParts.push(city);
    if (country) locationParts.push(country);
    const locationBase = locationParts.join(" - ");
    
    const placeholderData: Record<string, string> = {
      nome_participante: fullName,
      tipo_participacao: language === "en-US" ? "participant" : language === "es-ES" ? "participante" : "participante",
      nome_evento: eventName || eventSlug,
      data_evento: dateStr,
      carga_horaria: hours || "",
      data_emissao: dateStr,
      codigo_verificacao: code,
    };

    // Background (simples, pdf-lib não suporta gradientes nativamente)
    if (layoutConfig.background?.color) {
      const bgColor = hexToRgb(layoutConfig.background.color);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(bgColor.r, bgColor.g, bgColor.b),
      });
    }

    // Borda
    if (layoutConfig.border?.enabled && layoutConfig.border.thickness) {
      const borderColor = layoutConfig.border.gradient?.from 
        ? hexToRgb(layoutConfig.border.gradient.from)
        : { r: 0.2, g: 0.2, b: 0.5 };
      
      const thickness = layoutConfig.border.thickness;
      const margin = 20;
      
      page.drawRectangle({
        x: margin,
        y: margin,
        width: width - 2 * margin,
        height: height - 2 * margin,
        borderColor: rgb(borderColor.r, borderColor.g, borderColor.b),
        borderWidth: thickness,
      });
    }

    let currentY = height - 80;

    // Header - Title
    const headerTitle = replacePlaceholders(layoutConfig.header.title, placeholderData);
    const titleColor = hexToRgb(layoutConfig.header.titleColor);
    const titleSize = 32;
    const titleWidth = titleFont.widthOfTextAtSize(headerTitle, titleSize);
    
    page.drawText(headerTitle, {
      x: (width - titleWidth) / 2,
      y: currentY,
      size: titleSize,
      font: titleFont,
      color: rgb(titleColor.r, titleColor.g, titleColor.b),
    });
    
    currentY -= 40;

    // Header - Subtitle
    if (layoutConfig.header.subtitle) {
      const headerSubtitle = replacePlaceholders(layoutConfig.header.subtitle, placeholderData);
      const subtitleColor = hexToRgb(layoutConfig.header.subtitleColor);
      const subtitleSize = 16;
      const subtitleWidth = textFont.widthOfTextAtSize(headerSubtitle, subtitleSize);
      
      page.drawText(headerSubtitle, {
        x: (width - subtitleWidth) / 2,
        y: currentY,
        size: subtitleSize,
        font: textFont,
        color: rgb(subtitleColor.r, subtitleColor.g, subtitleColor.b),
      });
      
      currentY -= 60;
    } else {
      currentY -= 40;
    }

    // Body - Certify Label
    const certifyLabel = replacePlaceholders(layoutConfig.body.certifyLabel, placeholderData);
    const certifyLabelColor = hexToRgb(layoutConfig.body.certifyLabelColor);
    const certifyLabelSize = 14;
    const certifyLabelWidth = textFont.widthOfTextAtSize(certifyLabel, certifyLabelSize);
    
    page.drawText(certifyLabel, {
      x: (width - certifyLabelWidth) / 2,
      y: currentY,
      size: certifyLabelSize,
      font: textFont,
      color: rgb(certifyLabelColor.r, certifyLabelColor.g, certifyLabelColor.b),
    });
    
    currentY -= 30;

    // Body - Participant Name
    const participantName = replacePlaceholders(layoutConfig.body.participantNamePlaceholder, placeholderData);
    const nameColor = hexToRgb(layoutConfig.body.participantNameStyle.color);
    const nameSize = layoutConfig.body.participantNameStyle.fontSize || 36;
    const nameWidth = titleFont.widthOfTextAtSize(participantName, nameSize);
    
    page.drawText(participantName, {
      x: (width - nameWidth) / 2,
      y: currentY,
      size: nameSize,
      font: titleFont,
      color: rgb(nameColor.r, nameColor.g, nameColor.b),
    });
    
    currentY -= 50;

    // Body - Main Text (quebrado em linhas)
    const mainText = replacePlaceholders(layoutConfig.body.mainText, placeholderData);
    const mainTextColor = hexToRgb(layoutConfig.body.mainTextColor);
    const mainTextSize = 14;
    const maxTextWidth = width - 120;
    const textLines = wrapText(mainText, maxTextWidth, textFont, mainTextSize);
    
    for (const line of textLines) {
      const lineWidth = textFont.widthOfTextAtSize(line, mainTextSize);
      page.drawText(line, {
        x: (width - lineWidth) / 2,
        y: currentY,
        size: mainTextSize,
        font: textFont,
        color: rgb(mainTextColor.r, mainTextColor.g, mainTextColor.b),
      });
      currentY -= 20;
    }

    // Footer - Location/Date
    const footerLocation = replacePlaceholders(layoutConfig.footer.locationDateText, placeholderData);
    const footerColor = hexToRgb(layoutConfig.footer.locationDateColor);
    const footerSize = 12;
    const footerWidth = textFont.widthOfTextAtSize(footerLocation, footerSize);
    
    page.drawText(footerLocation, {
      x: (width - footerWidth) / 2,
      y: 120,
      size: footerSize,
      font: textFont,
      color: rgb(footerColor.r, footerColor.g, footerColor.b),
    });

    // Footer - Signatures
    if (layoutConfig.footer.signatures && layoutConfig.footer.signatures.length > 0) {
      const sigY = 80;
      const sigSpacing = width / (layoutConfig.footer.signatures.length + 1);
      
      layoutConfig.footer.signatures.forEach((sig, index) => {
        const sigX = sigSpacing * (index + 1);
        const sigName = replacePlaceholders(sig.name, placeholderData);
        const sigLabel = sig.label;
        
        // Nome do assinante
        const nameWidth = textFont.widthOfTextAtSize(sigName, 10);
        page.drawText(sigName, {
          x: sigX - nameWidth / 2,
          y: sigY,
          size: 10,
          font: titleFont,
          color: rgb(0, 0, 0),
        });
        
        // Label (cargo)
        const labelWidth = textFont.widthOfTextAtSize(sigLabel, 8);
        page.drawText(sigLabel, {
          x: sigX - labelWidth / 2,
          y: sigY - 15,
          size: 8,
          font: textFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        
        // Linha de assinatura
        page.drawLine({
          start: { x: sigX - 60, y: sigY + 5 },
          end: { x: sigX + 60, y: sigY + 5 },
          thickness: 1,
          color: rgb(0.5, 0.5, 0.5),
        });
      });
    }

    // Badge
    if (layoutConfig.badge?.enabled && layoutConfig.badge.text) {
      const badgeText = layoutConfig.badge.text;
      const badgeColor = hexToRgb(layoutConfig.badge.textColor);
      
      page.drawText(badgeText, {
        x: width - 150,
        y: height - 50,
        size: 10,
        font: titleFont,
        color: rgb(badgeColor.r, badgeColor.g, badgeColor.b),
      });
    }

    // Código de verificação no rodapé
    const codeLabel = language === "en-US" ? "Code:" : language === "es-ES" ? "Código:" : "Código:";
    page.drawText(`${codeLabel} ${code}`, {
      x: 40,
      y: 30,
      size: 8,
      font: textFont,
      color: rgb(0.4, 0.4, 0.4),
    });

  } else {
    // Fallback: template genérico (caso não tenha layout_config)
    console.error("FALLBACK TEMPLATE BEING USED - layout_config missing or incomplete:", {
      has_layoutConfig: !!layoutConfig,
      has_header: !!layoutConfig?.header,
      has_body: !!layoutConfig?.body,
      has_footer: !!layoutConfig?.footer,
      layoutConfig_json: JSON.stringify(layoutConfig),
      header_title: layoutConfig?.header?.title,
      body_certifyLabel: layoutConfig?.body?.certifyLabel,
      footer_locationDateText: layoutConfig?.footer?.locationDateText
    });
    console.error("THIS SHOULD NOT HAPPEN! Check event_certificates.layout_config in database!");
    
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
  }

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

    // Gerar PDF usando o layout_config do evento
    const layoutConfig = eventCert.layout_config as LayoutConfig | undefined;
    
    console.log("DEBUG - layout_config from database:", {
      has_config: !!layoutConfig,
      config_keys: layoutConfig ? Object.keys(layoutConfig) : [],
      has_header: !!layoutConfig?.header,
      has_body: !!layoutConfig?.body,
      has_footer: !!layoutConfig?.footer,
      header_keys: layoutConfig?.header ? Object.keys(layoutConfig.header) : [],
      body_keys: layoutConfig?.body ? Object.keys(layoutConfig.body) : [],
      footer_keys: layoutConfig?.footer ? Object.keys(layoutConfig.footer) : [],
      eventName,
      raw_layout_config: JSON.stringify(layoutConfig)
    });
    
    // Se layout_config estiver incompleto ou null, logar erro detalhado
    if (!layoutConfig || !layoutConfig.header || !layoutConfig.body || !layoutConfig.footer) {
      console.error("CRITICAL: layout_config is incomplete or missing!", {
        event_id: eventId,
        has_layout_config: !!eventCert.layout_config,
        layout_config_type: typeof eventCert.layout_config,
        missing_header: !layoutConfig?.header,
        missing_body: !layoutConfig?.body,
        missing_footer: !layoutConfig?.footer,
        full_config: JSON.stringify(eventCert.layout_config)
      });
    }
    
    const pdfBytes = await createCertificatePdf({
      fullName: normalizedFullName,
      eventSlug: event?.slug || "CIVENI 2025",
      eventName,
      language,
      issueDate,
      city: eventCert.city,
      country: eventCert.country,
      hours: eventCert.hours,
      code,
      layoutConfig,
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
