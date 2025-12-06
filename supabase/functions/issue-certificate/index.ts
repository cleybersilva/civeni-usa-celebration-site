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

// Sanitiza texto para fontes padrão PDF (WinAnsi encoding)
// Remove/substitui caracteres que não são suportados pela codificação WinAnsi
const sanitizeForPdf = (text: string): string => {
  if (!text) return "";
  
  // Mapa de caracteres turcos e outros não suportados para equivalentes ASCII
  const charMap: Record<string, string> = {
    "\u0130": "I",  // İ
    "\u0131": "i",  // ı
    "\u011E": "G",  // Ğ
    "\u011F": "g",  // ğ
    "\u015E": "S",  // Ş
    "\u015F": "s",  // ş
    "\u00DC": "U",  // Ü
    "\u00FC": "u",  // ü
    "\u00D6": "O",  // Ö
    "\u00F6": "o",  // ö
    "\u00C7": "C",  // Ç
    "\u00E7": "c",  // ç
    "\u00E3": "a",  // ã
    "\u00C3": "A",  // Ã
    "\u00F5": "o",  // õ
    "\u00D5": "O",  // Õ
    "\u00F1": "n",  // ñ
    "\u00D1": "N",  // Ñ
    "\u2013": "-",  // –
    "\u2014": "-",  // —
    "\u2018": "'",  // '
    "\u2019": "'",  // '
    "\u201C": '"',  // "
    "\u201D": '"',  // "
    "\u2026": "...",// …
  };
  
  let result = text;
  for (const [char, replacement] of Object.entries(charMap)) {
    result = result.replace(new RegExp(char, "g"), replacement);
  }
  
  // Remove qualquer caractere não ASCII restante que possa causar problemas
  result = result.replace(/[^\x00-\xFF]/g, "");
  
  return result;
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

// Helper para quebrar texto em linhas (usa texto já sanitizado)
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const sanitizedText = sanitizeForPdf(text);
  const words = sanitizedText.split(' ');
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
    style?: string;
    gradient?: {
      from: string;
      via?: string;
      to: string;
    };
  };
  header?: {
    title: string;
    titleColor: string;
    subtitle: string;
    subtitleColor: string;
    showLogo?: boolean;
    logoUrl?: string;
    logoPosition?: 'left' | 'center' | 'right';
  };
  body?: {
    certifyLabel: string;
    certifyLabelColor: string;
    participantNamePlaceholder: string;
    participantNameStyle: {
      fontSize: number;
      fontWeight?: string;
      color: string;
    };
    mainText: string;
    mainTextColor: string;
    alignment?: 'left' | 'center' | 'right';
  };
  footer?: {
    locationDateText: string;
    locationDateColor: string;
    signatureCount?: number;
    signatureLayout?: 'sides' | 'center' | 'left' | 'right';
    showCenterLogo?: boolean;
    centerLogoUrl?: string;
    signatures?: Array<{
      label: string;
      name: string;
      signatureImageUrl?: string;
    }>;
  };
  badge?: {
    enabled: boolean;
    text: string;
    textColor: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';
    backgroundGradient?: {
      from: string;
      to: string;
    };
  };
}

// Cores do gradiente CIVENI
const CIVENI_COLORS = {
  blue: { r: 0.008, g: 0.106, b: 0.227 },      // #021b3a
  purple: { r: 0.451, g: 0.106, b: 0.298 },   // #731b4c
  red: { r: 0.773, g: 0.114, b: 0.231 },      // #c51d3b
  white: { r: 1, g: 1, b: 1 },
  gold: { r: 0.855, g: 0.647, b: 0.125 },     // #DAA520
  darkText: { r: 0.1, g: 0.1, b: 0.1 },
};

// Criar PDF com design premium usando cores do CIVENI
// Agora usa as configurações do layout_config salvo no SaaS
const createCertificatePdf = async (
  options: CertificatePdfOptions & { layoutConfig?: LayoutConfig; eventName?: string },
): Promise<Uint8Array> => {
  const { fullName, eventSlug, language, issueDate, city, country, hours, code, layoutConfig, eventName } = options;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  console.log("Gerando certificado com design CIVENI premium - layoutConfig:", !!layoutConfig);

  // Preparar dados para substituição
  const dateStr = issueDate.toLocaleDateString(
    language === "en-US" ? "en-US" : language === "es-ES" ? "es-ES" : language === "tr-TR" ? "tr-TR" : "pt-BR",
  );

  // Extrair configurações do layout_config ou usar defaults
  const headerConfig = layoutConfig?.header;
  const bodyConfig = layoutConfig?.body;
  const footerConfig = layoutConfig?.footer;
  const borderConfig = layoutConfig?.border;
  const badgeConfig = layoutConfig?.badge;
  
  // ===== BACKGROUND BRANCO =====
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(1, 1, 1),
  });

  // ===== BORDA GRADIENTE EXTERNA (azul -> roxo -> vermelho) =====
  const borderEnabled = borderConfig?.enabled ?? true;
  const borderWidth = borderConfig?.thickness || 8;
  const margin = 20;
  
  // Cores do gradiente (do layout_config ou defaults)
  const borderFromColor = borderConfig?.gradient?.from 
    ? hexToRgb(borderConfig.gradient.from) 
    : CIVENI_COLORS.blue;
  const borderViaColor = borderConfig?.gradient?.via 
    ? hexToRgb(borderConfig.gradient.via) 
    : CIVENI_COLORS.purple;
  const borderToColor = borderConfig?.gradient?.to 
    ? hexToRgb(borderConfig.gradient.to) 
    : CIVENI_COLORS.red;

  if (borderEnabled) {
    // Top (azul para roxo para vermelho)
    for (let i = 0; i < borderWidth; i++) {
      const progress = i / borderWidth;
      const color = progress < 0.5 
        ? rgb(
            borderFromColor.r + (borderViaColor.r - borderFromColor.r) * (progress * 2),
            borderFromColor.g + (borderViaColor.g - borderFromColor.g) * (progress * 2),
            borderFromColor.b + (borderViaColor.b - borderFromColor.b) * (progress * 2)
          )
        : rgb(
            borderViaColor.r + (borderToColor.r - borderViaColor.r) * ((progress - 0.5) * 2),
            borderViaColor.g + (borderToColor.g - borderViaColor.g) * ((progress - 0.5) * 2),
            borderViaColor.b + (borderToColor.b - borderViaColor.b) * ((progress - 0.5) * 2)
          );
      
      page.drawLine({
        start: { x: margin, y: height - margin - i },
        end: { x: width - margin, y: height - margin - i },
        thickness: 1,
        color,
      });
    }
    
    // Bottom
    for (let i = 0; i < borderWidth; i++) {
      const progress = i / borderWidth;
      const color = progress < 0.5 
        ? rgb(
            borderFromColor.r + (borderViaColor.r - borderFromColor.r) * (progress * 2),
            borderFromColor.g + (borderViaColor.g - borderFromColor.g) * (progress * 2),
            borderFromColor.b + (borderViaColor.b - borderFromColor.b) * (progress * 2)
          )
        : rgb(
            borderViaColor.r + (borderToColor.r - borderViaColor.r) * ((progress - 0.5) * 2),
            borderViaColor.g + (borderToColor.g - borderViaColor.g) * ((progress - 0.5) * 2),
            borderViaColor.b + (borderToColor.b - borderViaColor.b) * ((progress - 0.5) * 2)
          );
      
      page.drawLine({
        start: { x: margin, y: margin + i },
        end: { x: width - margin, y: margin + i },
        thickness: 1,
        color,
      });
    }
    
    // Left side
    for (let i = 0; i < borderWidth; i++) {
      const progress = i / borderWidth;
      const color = rgb(
        borderFromColor.r + (borderViaColor.r - borderFromColor.r) * progress,
        borderFromColor.g + (borderViaColor.g - borderFromColor.g) * progress,
        borderFromColor.b + (borderViaColor.b - borderFromColor.b) * progress
      );
      
      page.drawLine({
        start: { x: margin + i, y: margin },
        end: { x: margin + i, y: height - margin },
        thickness: 1,
        color,
      });
    }
    
    // Right side
    for (let i = 0; i < borderWidth; i++) {
      const progress = i / borderWidth;
      const color = rgb(
        borderViaColor.r + (borderToColor.r - borderViaColor.r) * progress,
        borderViaColor.g + (borderToColor.g - borderViaColor.g) * progress,
        borderViaColor.b + (borderToColor.b - borderViaColor.b) * progress
      );
      
      page.drawLine({
        start: { x: width - margin - i, y: margin },
        end: { x: width - margin - i, y: height - margin },
        thickness: 1,
        color,
      });
    }
  }

  // ===== BORDA INTERNA ELEGANTE =====
  const innerMargin = margin + borderWidth + 6;
  page.drawRectangle({
    x: innerMargin,
    y: innerMargin,
    width: width - 2 * innerMargin,
    height: height - 2 * innerMargin,
    borderColor: rgb(CIVENI_COLORS.gold.r, CIVENI_COLORS.gold.g, CIVENI_COLORS.gold.b),
    borderWidth: 1,
  });

  // ===== HEADER GRADIENTE =====
  const headerHeight = 80;
  const headerY = height - margin - borderWidth - headerHeight;
  
  // Fundo do header com gradiente horizontal simulado
  const headerSteps = 50;
  const stepWidth = (width - 2 * innerMargin) / headerSteps;
  
  for (let i = 0; i < headerSteps; i++) {
    const progress = i / headerSteps;
    let r, g, b;
    
    if (progress < 0.33) {
      const p = progress / 0.33;
      r = borderFromColor.r + (borderViaColor.r - borderFromColor.r) * p;
      g = borderFromColor.g + (borderViaColor.g - borderFromColor.g) * p;
      b = borderFromColor.b + (borderViaColor.b - borderFromColor.b) * p;
    } else if (progress < 0.66) {
      r = borderViaColor.r;
      g = borderViaColor.g;
      b = borderViaColor.b;
    } else {
      const p = (progress - 0.66) / 0.34;
      r = borderViaColor.r + (borderToColor.r - borderViaColor.r) * p;
      g = borderViaColor.g + (borderToColor.g - borderViaColor.g) * p;
      b = borderViaColor.b + (borderToColor.b - borderViaColor.b) * p;
    }
    
    page.drawRectangle({
      x: innerMargin + i * stepWidth,
      y: headerY,
      width: stepWidth + 1,
      height: headerHeight,
      color: rgb(r, g, b),
    });
  }

  // ===== LOGO NO HEADER =====
  let headerLogoImage = null;
  const showHeaderLogo = headerConfig?.showLogo ?? true;
  const headerLogoUrl = headerConfig?.logoUrl || '/uploads/vccu-logo-certificate.png';
  const logoPosition = headerConfig?.logoPosition || 'left';
  
  if (showHeaderLogo) {
    try {
      const logoUrls = [
        headerLogoUrl.startsWith('http') ? headerLogoUrl : `https://civeni.com${headerLogoUrl}`,
        "https://civeni.com/uploads/vccu-logo-certificate.png"
      ];
      
      for (const logoUrl of logoUrls) {
        try {
          console.log("Trying header logo URL:", logoUrl);
          const logoResponse = await fetch(logoUrl);
          
          if (logoResponse.ok) {
            const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
            
            const isPng = logoBytes[0] === 0x89 && logoBytes[1] === 0x50 && logoBytes[2] === 0x4E && logoBytes[3] === 0x47;
            const isJpg = logoBytes[0] === 0xFF && logoBytes[1] === 0xD8;
            
            if (isPng) {
              headerLogoImage = await pdfDoc.embedPng(logoBytes);
              console.log("Header logo embedded as PNG");
              break;
            } else if (isJpg) {
              headerLogoImage = await pdfDoc.embedJpg(logoBytes);
              console.log("Header logo embedded as JPG");
              break;
            }
          }
        } catch (urlError) {
          console.log("Error loading header logo:", urlError);
          continue;
        }
      }
    } catch (logoError) {
      console.log("Could not load header logo:", logoError);
    }
  }

  // ===== TÍTULO PRINCIPAL (do layout_config ou default por idioma) =====
  const titleTextRaw = headerConfig?.title || (
    language === "en-US" ? "CERTIFICATE OF PARTICIPATION" 
    : language === "es-ES" ? "CERTIFICADO DE PARTICIPACION"
    : language === "tr-TR" ? "KATILIM SERTIFIKASI"
    : "CERTIFICADO DE PARTICIPACAO"
  );
  const titleText = sanitizeForPdf(titleTextRaw);
  
  const titleSize = 28;
  const titleWidth = titleFont.widthOfTextAtSize(titleText, titleSize);
  
  // Calcular posições para logo + título
  const logoSize = 55;
  const gapBetweenLogoAndTitle = 15;
  const totalContentWidth = headerLogoImage && logoPosition !== 'center' 
    ? (logoSize + gapBetweenLogoAndTitle + titleWidth) 
    : titleWidth;
  const contentStartX = (width - totalContentWidth) / 2;
  
  // Posição do logo baseada na configuração
  let logoX = contentStartX;
  if (logoPosition === 'center') {
    logoX = (width - logoSize) / 2;
  } else if (logoPosition === 'right') {
    logoX = contentStartX + titleWidth + gapBetweenLogoAndTitle;
  }
  const logoY = headerY + (headerHeight - logoSize) / 2;
  
  // Desenhar logo do header
  if (headerLogoImage && showHeaderLogo) {
    const logoDims = headerLogoImage.scale(logoSize / headerLogoImage.height);
    page.drawImage(headerLogoImage, {
      x: logoX,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height,
    });
  }
  
  // Posição do título
  let titleX: number;
  if (logoPosition === 'center') {
    titleX = (width - titleWidth) / 2;
  } else if (logoPosition === 'right') {
    titleX = contentStartX;
  } else {
    titleX = headerLogoImage ? (logoX + logoSize + gapBetweenLogoAndTitle) : contentStartX;
  }
  
  page.drawText(titleText, {
    x: titleX,
    y: headerY + (headerHeight / 2) + 5,
    size: titleSize,
    font: titleFont,
    color: rgb(1, 1, 1),
  });

  // ===== SUBTÍTULO DO EVENTO =====
  const subtitleTextRaw = headerConfig?.subtitle || "III CIVENI 2025 - International Multidisciplinary Congress";
  const subtitleText = sanitizeForPdf(subtitleTextRaw);
  const subtitleSize = 10;
  const subtitleWidth = textFont.widthOfTextAtSize(subtitleText, subtitleSize);
  const subtitleX = (width - subtitleWidth) / 2;
  
  page.drawText(subtitleText, {
    x: subtitleX,
    y: headerY + 15,
    size: subtitleSize,
    font: textFont,
    color: rgb(1, 1, 1),
  });

  let currentY = headerY - 50;

  // ===== TEXTO "CERTIFICAMOS QUE" =====
  const certifyTextRaw = bodyConfig?.certifyLabel || (
    language === "en-US" ? "We hereby certify that"
    : language === "es-ES" ? "Certificamos que"
    : language === "tr-TR" ? "Isbu belge ile tasdik ederiz ki"
    : "Certificamos que"
  );
  const certifyText = sanitizeForPdf(certifyTextRaw);
  
  const certifySize = 14;
  const certifyWidth = italicFont.widthOfTextAtSize(certifyText, certifySize);
  
  // Cor do texto "Certificamos que"
  const certifyLabelColor = bodyConfig?.certifyLabelColor 
    ? hexToRgb(bodyConfig.certifyLabelColor) 
    : { r: 0.4, g: 0.4, b: 0.4 };
  
  page.drawText(certifyText, {
    x: (width - certifyWidth) / 2,
    y: currentY,
    size: certifySize,
    font: italicFont,
    color: rgb(certifyLabelColor.r, certifyLabelColor.g, certifyLabelColor.b),
  });

  currentY -= 45;

  // ===== NOME DO PARTICIPANTE =====
  const sanitizedName = sanitizeForPdf(fullName.toUpperCase());
  const nameSize = bodyConfig?.participantNameStyle?.fontSize || 36;
  const nameWidth = titleFont.widthOfTextAtSize(sanitizedName, nameSize);
  
  // Cor do nome do participante
  const nameColor = bodyConfig?.participantNameStyle?.color 
    ? hexToRgb(bodyConfig.participantNameStyle.color) 
    : CIVENI_COLORS.blue;
  
  page.drawText(sanitizedName, {
    x: (width - nameWidth) / 2,
    y: currentY,
    size: nameSize,
    font: titleFont,
    color: rgb(nameColor.r, nameColor.g, nameColor.b),
  });

  // Linha decorativa abaixo do nome
  const lineWidth = Math.min(nameWidth + 60, width - 200);
  page.drawLine({
    start: { x: (width - lineWidth) / 2, y: currentY - 10 },
    end: { x: (width + lineWidth) / 2, y: currentY - 10 },
    thickness: 2,
    color: rgb(CIVENI_COLORS.gold.r, CIVENI_COLORS.gold.g, CIVENI_COLORS.gold.b),
  });

  currentY -= 50;

  // ===== TEXTO PRINCIPAL =====
  const participationTypeRaw = language === "en-US" ? "participant" 
    : language === "es-ES" ? "participante"
    : language === "tr-TR" ? "katilimci"
    : "participante";
  const participationType = sanitizeForPdf(participationTypeRaw);
  
  // Texto do corpo (do layout_config ou default)
  let mainTextLine1Raw: string;
  if (bodyConfig?.mainText) {
    // Substituir placeholders no texto do layout_config
    mainTextLine1Raw = bodyConfig.mainText
      .replace(/\{\{nome_participante\}\}/g, '')
      .replace(/\{\{tipo_participacao\}\}/g, participationType)
      .replace(/\{\{nome_evento\}\}/g, eventName || 'III CIVENI 2025')
      .replace(/\{\{data_evento\}\}/g, '11 a 14 de dezembro de 2025')
      .replace(/\{\{carga_horaria\}\}/g, hours || '20');
  } else {
    mainTextLine1Raw = language === "en-US" 
      ? `participated as ${participationType} in the`
      : language === "es-ES"
      ? `participo como ${participationType} en el`
      : language === "tr-TR"
      ? `${participationType} olarak katilmistir:`
      : `participou como ${participationType} do`;
  }
  const mainTextLine1 = sanitizeForPdf(mainTextLine1Raw);

  const mainTextSize = 13;
  const mainTextWidth1 = textFont.widthOfTextAtSize(mainTextLine1, mainTextSize);
  
  // Cor do texto principal
  const mainTextColor = bodyConfig?.mainTextColor 
    ? hexToRgb(bodyConfig.mainTextColor) 
    : { r: 0.3, g: 0.3, b: 0.3 };
  
  page.drawText(mainTextLine1, {
    x: (width - mainTextWidth1) / 2,
    y: currentY,
    size: mainTextSize,
    font: textFont,
    color: rgb(mainTextColor.r, mainTextColor.g, mainTextColor.b),
  });

  currentY -= 28;

  // Nome do evento em destaque (se não tiver mainText customizado)
  if (!bodyConfig?.mainText) {
    const eventDisplayNameRaw = eventName || "III CIVENI 2025";
    const eventDisplayName = sanitizeForPdf(eventDisplayNameRaw);
    const eventNameSize = 16;
    const eventNameWidth = titleFont.widthOfTextAtSize(eventDisplayName, eventNameSize);
    
    page.drawText(eventDisplayName, {
      x: (width - eventNameWidth) / 2,
      y: currentY,
      size: eventNameSize,
      font: titleFont,
      color: rgb(CIVENI_COLORS.purple.r, CIVENI_COLORS.purple.g, CIVENI_COLORS.purple.b),
    });

    currentY -= 30;

    // Informações adicionais
    const hoursTextRaw = language === "en-US" 
      ? `with a total workload of ${hours || "20"} hours.`
      : language === "es-ES"
      ? `con una carga horaria total de ${hours || "20"} horas.`
      : language === "tr-TR"
      ? `toplam ${hours || "20"} saat is yuku ile.`
      : `com carga horaria total de ${hours || "20"} horas.`;
    const hoursText = sanitizeForPdf(hoursTextRaw);
    
    const hoursWidth = textFont.widthOfTextAtSize(hoursText, mainTextSize);
    
    page.drawText(hoursText, {
      x: (width - hoursWidth) / 2,
      y: currentY,
      size: mainTextSize,
      font: textFont,
      color: rgb(mainTextColor.r, mainTextColor.g, mainTextColor.b),
    });
  }

  // ===== FOOTER COM GRADIENTE =====
  const footerHeight = 65;
  const footerY = innerMargin;
  
  // Fundo do footer com gradiente
  for (let i = 0; i < headerSteps; i++) {
    const progress = i / headerSteps;
    let r, g, b;
    
    if (progress < 0.33) {
      const p = progress / 0.33;
      r = borderFromColor.r + (borderViaColor.r - borderFromColor.r) * p;
      g = borderFromColor.g + (borderViaColor.g - borderFromColor.g) * p;
      b = borderFromColor.b + (borderViaColor.b - borderFromColor.b) * p;
    } else if (progress < 0.66) {
      r = borderViaColor.r;
      g = borderViaColor.g;
      b = borderViaColor.b;
    } else {
      const p = (progress - 0.66) / 0.34;
      r = borderViaColor.r + (borderToColor.r - borderViaColor.r) * p;
      g = borderViaColor.g + (borderToColor.g - borderViaColor.g) * p;
      b = borderViaColor.b + (borderToColor.b - borderViaColor.b) * p;
    }
    
    page.drawRectangle({
      x: innerMargin + i * stepWidth,
      y: footerY,
      width: stepWidth + 1,
      height: footerHeight,
      color: rgb(r, g, b),
    });
  }

  // ===== ASSINATURAS =====
  const signatureCount = footerConfig?.signatureCount ?? 2;
  const signatureLayout = footerConfig?.signatureLayout || 'sides';
  const sigY = 160;
  const sigSpacing = width / 3;
  
  // Obter assinaturas do layout_config ou usar defaults
  const signaturesConfig = footerConfig?.signatures || [
    { 
      name: "Dra. Maria Emilia Camargo", 
      label: language === "en-US" ? "Dean of International Relations/VCCU" 
        : language === "es-ES" ? "Decana de Relaciones Internacionales/VCCU"
        : language === "tr-TR" ? "Uluslararasi Iliskiler Dekani/VCCU"
        : "Reitora de Relacoes Internacionais/VCCU"
    },
    { 
      name: "Dra. Marcela Tardanza Martins", 
      label: language === "en-US" ? "Dean of Academic Relations/VCCU"
        : language === "es-ES" ? "Decana de Relaciones Academicas/VCCU"
        : language === "tr-TR" ? "Akademik Iliskiler Dekani/VCCU"
        : "Reitora de Relacoes Academicas/VCCU"
    }
  ];

  const signatures = signaturesConfig.slice(0, signatureCount).map(sig => ({
    name: sanitizeForPdf(sig.name),
    role: sanitizeForPdf(sig.label)
  }));
  
  // Calcular posições das assinaturas baseado na configuração
  if (signatureCount === 1) {
    const sig = signatures[0];
    let sigX: number;
    
    if (signatureLayout === 'left') {
      sigX = width * 0.25;
    } else if (signatureLayout === 'right') {
      sigX = width * 0.75;
    } else { // center
      sigX = width / 2;
    }
    
    // Linha de assinatura
    page.drawLine({
      start: { x: sigX - 90, y: sigY + 5 },
      end: { x: sigX + 90, y: sigY + 5 },
      thickness: 1,
      color: rgb(0.6, 0.6, 0.6),
    });
    
    // Nome
    const sigNameWidth = titleFont.widthOfTextAtSize(sig.name, 10);
    page.drawText(sig.name, {
      x: sigX - sigNameWidth / 2,
      y: sigY - 12,
      size: 10,
      font: titleFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Cargo
    const sigRoleWidth = textFont.widthOfTextAtSize(sig.role, 8);
    page.drawText(sig.role, {
      x: sigX - sigRoleWidth / 2,
      y: sigY - 25,
      size: 8,
      font: textFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  } else {
    // 2 assinaturas
    signatures.forEach((sig, index) => {
      const sigX = sigSpacing * (index + 1);
      
      // Linha de assinatura
      page.drawLine({
        start: { x: sigX - 90, y: sigY + 5 },
        end: { x: sigX + 90, y: sigY + 5 },
        thickness: 1,
        color: rgb(0.6, 0.6, 0.6),
      });
      
      // Nome
      const sigNameWidth = titleFont.widthOfTextAtSize(sig.name, 10);
      page.drawText(sig.name, {
        x: sigX - sigNameWidth / 2,
        y: sigY - 12,
        size: 10,
        font: titleFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      
      // Cargo
      const sigRoleWidth = textFont.widthOfTextAtSize(sig.role, 8);
      page.drawText(sig.role, {
        x: sigX - sigRoleWidth / 2,
        y: sigY - 25,
        size: 8,
        font: textFont,
        color: rgb(0.4, 0.4, 0.4),
      });
    });
  }

  // ===== LOCAL E DATA NO FOOTER =====
  const locationDateTextRaw = footerConfig?.locationDateText 
    ? footerConfig.locationDateText.replace(/\{\{data_emissao\}\}/g, dateStr)
    : `Celebration, Florida - USA, ${dateStr}`;
  const locationText = sanitizeForPdf(locationDateTextRaw);
  const locationWidth = textFont.widthOfTextAtSize(locationText, 10);
  
  page.drawText(locationText, {
    x: (width - locationWidth) / 2,
    y: footerY + footerHeight - 20,
    size: 10,
    font: textFont,
    color: rgb(1, 1, 1),
  });

  // ===== CÓDIGO DE VERIFICAÇÃO =====
  const codeLabelRaw = language === "en-US" ? "Verification Code:" 
    : language === "es-ES" ? "Codigo de Verificacion:"
    : language === "tr-TR" ? "Dogrulama Kodu:"
    : "Codigo de Verificacao:";
  const codeLabel = sanitizeForPdf(codeLabelRaw);
  
  const codeText = `${codeLabel} ${code}`;
  
  page.drawText(codeText, {
    x: innerMargin + 15,
    y: footerY + 15,
    size: 9,
    font: textFont,
    color: rgb(1, 1, 1),
  });

  // URL de verificação
  const verifyUrl = `civeni.com/verificar-certificado`;
  const verifyWidth = textFont.widthOfTextAtSize(verifyUrl, 8);
  
  page.drawText(verifyUrl, {
    x: width - innerMargin - verifyWidth - 15,
    y: footerY + 15,
    size: 8,
    font: textFont,
    color: rgb(0.9, 0.9, 0.9),
  });

  // ===== LOGO CENTRAL ENTRE ASSINATURAS =====
  const showCenterLogo = footerConfig?.showCenterLogo ?? true;
  const centerLogoUrl = footerConfig?.centerLogoUrl || '/uploads/civeni-logo-certificate.png';
  
  if (showCenterLogo) {
    let civeniLogoImage = null;
    try {
      const civeniLogoUrls = [
        centerLogoUrl.startsWith('http') ? centerLogoUrl : `https://civeni.com${centerLogoUrl}`,
        "https://civeni.com/uploads/civeni-logo-certificate.png"
      ];
      
      for (const civeniLogoUrl of civeniLogoUrls) {
        try {
          console.log("Trying CIVENI logo URL:", civeniLogoUrl);
          const civeniLogoResponse = await fetch(civeniLogoUrl);
          
          if (civeniLogoResponse.ok) {
            const civeniLogoBytes = new Uint8Array(await civeniLogoResponse.arrayBuffer());
            
            const isPng = civeniLogoBytes[0] === 0x89 && civeniLogoBytes[1] === 0x50 && civeniLogoBytes[2] === 0x4E && civeniLogoBytes[3] === 0x47;
            const isJpg = civeniLogoBytes[0] === 0xFF && civeniLogoBytes[1] === 0xD8;
            
            if (isPng) {
              civeniLogoImage = await pdfDoc.embedPng(civeniLogoBytes);
              console.log("CIVENI logo embedded as PNG");
              break;
            } else if (isJpg) {
              civeniLogoImage = await pdfDoc.embedJpg(civeniLogoBytes);
              console.log("CIVENI logo embedded as JPG");
              break;
            }
          }
        } catch (urlError) {
          console.log("Error loading CIVENI logo:", urlError);
          continue;
        }
      }
    } catch (logoError) {
      console.log("Could not load CIVENI logo:", logoError);
    }

    // Desenhar logo CIVENI centralizado entre as assinaturas
    if (civeniLogoImage) {
      const civeniLogoHeight = 50;
      const civeniLogoDims = civeniLogoImage.scale(civeniLogoHeight / civeniLogoImage.height);
      const civeniLogoX = (width - civeniLogoDims.width) / 2;
      const civeniLogoY = sigY - 65;
      
      page.drawImage(civeniLogoImage, {
        x: civeniLogoX,
        y: civeniLogoY,
        width: civeniLogoDims.width,
        height: civeniLogoDims.height,
      });
    } else {
      // Fallback - desenhar texto simples
      const badgeText = badgeConfig?.text || "III CIVENI 2025";
      const badgeTextWidth = titleFont.widthOfTextAtSize(badgeText, 12);
      
      page.drawText(badgeText, {
        x: (width - badgeTextWidth) / 2,
        y: sigY - 55,
        size: 12,
        font: titleFont,
        color: rgb(CIVENI_COLORS.purple.r, CIVENI_COLORS.purple.g, CIVENI_COLORS.purple.b),
      });
    }
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

    const body = await req.json();
    const { eventId, email, fullName, keywords } = body as CertificateRequest;
    // Get language from request body (sent by frontend based on user's selected language)
    const requestLanguage = body.language || "pt-BR";

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

    // Mensagens por idioma - usa o idioma enviado pelo frontend (baseado na seleção do usuário)
    const language = requestLanguage;
    console.log("Using language from frontend:", language);
    
    const messages = {
      "pt-BR": {
        invalidData: "Dados inválidos. É necessário fornecer 3 palavras-chave.",
        nameMin: "Nome deve ter pelo menos 2 caracteres",
        tooManyAttempts: "Muitas tentativas. Tente novamente em 1 hora.",
        eventNotFound: "Evento não encontrado ou certificados não habilitados",
        emailNotRegistered: "E-mail não encontrado. Verifique se você utilizou o mesmo e-mail da sua inscrição no CIVENI.",
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
        emailNotRegistered: "Email not found. Please verify you are using the same email from your CIVENI registration.",
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
        emailNotRegistered: "Correo electrónico no encontrado. Verifique que esté utilizando el mismo correo de su inscripción en CIVENI.",
        keywordsMismatch: (matched: number, required: number) =>
          `Acertó ${matched}/3 palabras clave. Mínimo requerido: ${required}/3`,
        alreadyIssued: (date: string) => `Certificado ya emitido el ${date}`,
        success: "¡Certificado emitido con éxito!",
      },
      "tr-TR": {
        invalidData: "Geçersiz veri. 3 anahtar kelime gereklidir.",
        nameMin: "Ad en az 2 karakter olmalıdır",
        tooManyAttempts: "Çok fazla deneme. 1 saat sonra tekrar deneyin.",
        eventNotFound: "Etkinlik bulunamadı veya sertifikalar etkinleştirilmemiş",
        emailNotRegistered: "E-posta bulunamadı. CIVENI kaydınızda kullandığınız e-postayı doğrulayın.",
        keywordsMismatch: (matched: number, required: number) =>
          `${matched}/3 anahtar kelime doğru. Gerekli minimum: ${required}/3`,
        alreadyIssued: (date: string) => `Sertifika zaten ${date} tarihinde verildi`,
        success: "Sertifika başarıyla verildi!",
      },
    };

    const msg = messages[language as keyof typeof messages] || messages["pt-BR"];

    if (normalizedFullName.length < 2) {
      return new Response(
        JSON.stringify({ success: false, message: msg.nameMin }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // VALIDAÇÃO 1: Verificar se o e-mail existe na tabela de inscrições com pagamento confirmado
    const { data: registration, error: registrationError } = await supabase
      .from("event_registrations")
      .select("id, email, full_name, payment_status")
      .ilike("email", normalizedEmail)
      .eq("payment_status", "completed")
      .maybeSingle();

    if (registrationError) {
      console.error("Error checking registration:", registrationError);
    }

    if (!registration) {
      console.log("Email not found in registrations:", normalizedEmail);
      return new Response(
        JSON.stringify({
          success: false,
          message: msg.emailNotRegistered,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log("Registration found for email:", normalizedEmail, "Name:", registration.full_name);

    // VALIDAÇÃO 2: Verificar palavras-chave
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

    // Gerar PDF usando layout_config do evento
    const layoutConfig = eventCert.layout_config as LayoutConfig | undefined;
    
    console.log("Gerando PDF com layout_config:", {
      has_config: !!layoutConfig,
      has_header: !!layoutConfig?.header,
      has_body: !!layoutConfig?.body,
      has_footer: !!layoutConfig?.footer
    });
    
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
        JSON.stringify({ success: false, message: "Erro ao salvar certificado" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
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
