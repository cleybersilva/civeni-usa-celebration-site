import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
// Remove/substitui apenas caracteres que NÃO são suportados pela codificação WinAnsi
// Nota: Caracteres acentuados latinos (Ç, ç, Ã, ã, Á, á, É, é, Í, í, Ó, ó, Ú, ú, Ñ, ñ, etc.) 
// SÃO suportados pela codificação WinAnsi e NÃO devem ser substituídos
const sanitizeForPdf = (text: string): string => {
  if (!text) return "";
  
  // Mapa APENAS de caracteres turcos e outros que NÃO são suportados pelo WinAnsi
  // Caracteres latinos acentuados (português, espanhol) são MANTIDOS pois WinAnsi os suporta
  const charMap: Record<string, string> = {
    "\u0130": "I",  // İ (turco - NÃO suportado)
    "\u0131": "i",  // ı (turco - NÃO suportado)
    "\u011E": "G",  // Ğ (turco - NÃO suportado)
    "\u011F": "g",  // ğ (turco - NÃO suportado)
    "\u015E": "S",  // Ş (turco - NÃO suportado)
    "\u015F": "s",  // ş (turco - NÃO suportado)
    "\u2013": "-",  // – (en dash)
    "\u2014": "-",  // — (em dash)
    "\u2018": "'",  // ' (curly quote)
    "\u2019": "'",  // ' (curly quote)
    "\u201C": '"',  // " (curly quote)
    "\u201D": '"',  // " (curly quote)
    "\u2026": "...",// … (ellipsis)
  };
  
  let result = text;
  for (const [char, replacement] of Object.entries(charMap)) {
    result = result.replace(new RegExp(char, "g"), replacement);
  }
  
  // Remove apenas caracteres fora do range Latin-1 Supplement (WinAnsi suporta até 0xFF)
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
  };
  border?: {
    enabled: boolean;
    thickness?: number;
    style?: string;
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
    showLogo?: boolean;
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
    position?: string;
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

  console.log("Gerando certificado com design CIVENI premium");

  // Preparar dados para substituição
  const dateStr = issueDate.toLocaleDateString(
    language === "en-US" ? "en-US" : language === "es-ES" ? "es-ES" : language === "tr-TR" ? "tr-TR" : "pt-BR",
  );
  
  // ===== BACKGROUND BRANCO =====
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(1, 1, 1),
  });

  // ===== BORDA GRADIENTE EXTERNA (azul -> roxo -> vermelho) =====
  const borderWidth = 8;
  const margin = 20;
  
  // Borda externa - simulando gradiente com múltiplas linhas
  // Top (azul para roxo para vermelho)
  for (let i = 0; i < borderWidth; i++) {
    const progress = i / borderWidth;
    const color = progress < 0.5 
      ? rgb(
          CIVENI_COLORS.blue.r + (CIVENI_COLORS.purple.r - CIVENI_COLORS.blue.r) * (progress * 2),
          CIVENI_COLORS.blue.g + (CIVENI_COLORS.purple.g - CIVENI_COLORS.blue.g) * (progress * 2),
          CIVENI_COLORS.blue.b + (CIVENI_COLORS.purple.b - CIVENI_COLORS.blue.b) * (progress * 2)
        )
      : rgb(
          CIVENI_COLORS.purple.r + (CIVENI_COLORS.red.r - CIVENI_COLORS.purple.r) * ((progress - 0.5) * 2),
          CIVENI_COLORS.purple.g + (CIVENI_COLORS.red.g - CIVENI_COLORS.purple.g) * ((progress - 0.5) * 2),
          CIVENI_COLORS.purple.b + (CIVENI_COLORS.red.b - CIVENI_COLORS.purple.b) * ((progress - 0.5) * 2)
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
          CIVENI_COLORS.blue.r + (CIVENI_COLORS.purple.r - CIVENI_COLORS.blue.r) * (progress * 2),
          CIVENI_COLORS.blue.g + (CIVENI_COLORS.purple.g - CIVENI_COLORS.blue.g) * (progress * 2),
          CIVENI_COLORS.blue.b + (CIVENI_COLORS.purple.b - CIVENI_COLORS.blue.b) * (progress * 2)
        )
      : rgb(
          CIVENI_COLORS.purple.r + (CIVENI_COLORS.red.r - CIVENI_COLORS.purple.r) * ((progress - 0.5) * 2),
          CIVENI_COLORS.purple.g + (CIVENI_COLORS.red.g - CIVENI_COLORS.purple.g) * ((progress - 0.5) * 2),
          CIVENI_COLORS.purple.b + (CIVENI_COLORS.red.b - CIVENI_COLORS.purple.b) * ((progress - 0.5) * 2)
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
      CIVENI_COLORS.blue.r + (CIVENI_COLORS.purple.r - CIVENI_COLORS.blue.r) * progress,
      CIVENI_COLORS.blue.g + (CIVENI_COLORS.purple.g - CIVENI_COLORS.blue.g) * progress,
      CIVENI_COLORS.blue.b + (CIVENI_COLORS.purple.b - CIVENI_COLORS.blue.b) * progress
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
      CIVENI_COLORS.purple.r + (CIVENI_COLORS.red.r - CIVENI_COLORS.purple.r) * progress,
      CIVENI_COLORS.purple.g + (CIVENI_COLORS.red.g - CIVENI_COLORS.purple.g) * progress,
      CIVENI_COLORS.purple.b + (CIVENI_COLORS.red.b - CIVENI_COLORS.purple.b) * progress
    );
    
    page.drawLine({
      start: { x: width - margin - i, y: margin },
      end: { x: width - margin - i, y: height - margin },
      thickness: 1,
      color,
    });
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
      r = CIVENI_COLORS.blue.r + (CIVENI_COLORS.purple.r - CIVENI_COLORS.blue.r) * p;
      g = CIVENI_COLORS.blue.g + (CIVENI_COLORS.purple.g - CIVENI_COLORS.blue.g) * p;
      b = CIVENI_COLORS.blue.b + (CIVENI_COLORS.purple.b - CIVENI_COLORS.blue.b) * p;
    } else if (progress < 0.66) {
      const p = (progress - 0.33) / 0.33;
      r = CIVENI_COLORS.purple.r;
      g = CIVENI_COLORS.purple.g;
      b = CIVENI_COLORS.purple.b;
    } else {
      const p = (progress - 0.66) / 0.34;
      r = CIVENI_COLORS.purple.r + (CIVENI_COLORS.red.r - CIVENI_COLORS.purple.r) * p;
      g = CIVENI_COLORS.purple.g + (CIVENI_COLORS.red.g - CIVENI_COLORS.purple.g) * p;
      b = CIVENI_COLORS.purple.b + (CIVENI_COLORS.red.b - CIVENI_COLORS.purple.b) * p;
    }
    
    page.drawRectangle({
      x: innerMargin + i * stepWidth,
      y: headerY,
      width: stepWidth + 1,
      height: headerHeight,
      color: rgb(r, g, b),
    });
  }

  // ===== VCCU LOGO NO HEADER (lado esquerdo) =====
  // NOTA: pdf-lib só suporta PNG e JPG. WebP não é suportado.
  // As imagens do Lovable são servidas como WebP, então precisamos usar URLs externas ou base64
  let vccuLogoImage = null;
  try {
    // Tentar carregar logo VCCU de diferentes URLs
    // Google Drive link convertido para download direto
    const vccuLogoUrls = [
      // Google Drive link para logo CIVENI cabeça colorida (IV CIVENI)
      "https://drive.google.com/uc?export=download&id=1GuqO-hpGvoBlbr6rUuvZIS457792VRwM"
    ];
    
    for (const vccuLogoUrl of vccuLogoUrls) {
      try {
        console.log("Trying VCCU logo URL:", vccuLogoUrl);
        const vccuLogoResponse = await fetch(vccuLogoUrl);
        console.log("VCCU logo fetch response status:", vccuLogoResponse.status);
        
        if (vccuLogoResponse.ok) {
          const vccuLogoBytes = new Uint8Array(await vccuLogoResponse.arrayBuffer());
          console.log("VCCU logo bytes length:", vccuLogoBytes.length);
          console.log("VCCU logo first 12 bytes:", Array.from(vccuLogoBytes.slice(0, 12)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          
          // Detectar formato da imagem pelos bytes mágicos
          const isPng = vccuLogoBytes[0] === 0x89 && vccuLogoBytes[1] === 0x50 && vccuLogoBytes[2] === 0x4E && vccuLogoBytes[3] === 0x47;
          const isJpg = vccuLogoBytes[0] === 0xFF && vccuLogoBytes[1] === 0xD8;
          // WebP: RIFF....WEBP
          const isWebP = vccuLogoBytes[0] === 0x52 && vccuLogoBytes[1] === 0x49 && vccuLogoBytes[2] === 0x46 && vccuLogoBytes[3] === 0x46 &&
                         vccuLogoBytes[8] === 0x57 && vccuLogoBytes[9] === 0x45 && vccuLogoBytes[10] === 0x42 && vccuLogoBytes[11] === 0x50;
          
          console.log("VCCU logo format detection - isPng:", isPng, "isJpg:", isJpg, "isWebP:", isWebP);
          
          if (isPng) {
            vccuLogoImage = await pdfDoc.embedPng(vccuLogoBytes);
            console.log("VCCU logo embedded as PNG successfully");
            break;
          } else if (isJpg) {
            vccuLogoImage = await pdfDoc.embedJpg(vccuLogoBytes);
            console.log("VCCU logo embedded as JPG successfully");
            break;
          } else if (isWebP) {
            console.log("VCCU logo is WebP format - NOT SUPPORTED by pdf-lib, trying next URL");
            continue;
          } else {
            console.log("VCCU logo format unknown, trying next URL");
            continue;
          }
        }
      } catch (urlError) {
        console.log("Error loading VCCU logo from URL:", vccuLogoUrl, urlError);
        continue;
      }
    }
  } catch (logoError) {
    console.log("Could not load VCCU logo, continuing without it:", logoError);
  }

  // ===== CARREGAR LOGO CIVENI PARA O CABEÇALHO =====
  let civeniHeaderLogoImage = null;
  try {
    // Tentar múltiplas URLs para a logo do CIVENI
    // O Lovable CDN converte imagens para WebP, então precisamos usar uma fonte externa
    const civeniHeaderLogoUrls = [
      // Google Drive link para logo IV CIVENI com texto branco
      "https://drive.google.com/uc?export=download&id=1zmZx3PQZbV-pYokpLBTNYfry1hVuQ70k"
    ];
    
    for (const civeniHeaderLogoUrl of civeniHeaderLogoUrls) {
      try {
        console.log("Trying CIVENI header logo URL:", civeniHeaderLogoUrl);
        const civeniHeaderResponse = await fetch(civeniHeaderLogoUrl);
        console.log("CIVENI header logo fetch status:", civeniHeaderResponse.status);
        
        if (civeniHeaderResponse.ok) {
          const civeniHeaderBytes = new Uint8Array(await civeniHeaderResponse.arrayBuffer());
          console.log("CIVENI header logo bytes length:", civeniHeaderBytes.length);
          console.log("CIVENI header logo first 12 bytes:", Array.from(civeniHeaderBytes.slice(0, 12)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
          
          const isPng = civeniHeaderBytes[0] === 0x89 && civeniHeaderBytes[1] === 0x50 && civeniHeaderBytes[2] === 0x4E && civeniHeaderBytes[3] === 0x47;
          const isJpg = civeniHeaderBytes[0] === 0xFF && civeniHeaderBytes[1] === 0xD8;
          const isWebP = civeniHeaderBytes[0] === 0x52 && civeniHeaderBytes[1] === 0x49 && civeniHeaderBytes[2] === 0x46 && civeniHeaderBytes[3] === 0x46 &&
                         civeniHeaderBytes[8] === 0x57 && civeniHeaderBytes[9] === 0x45 && civeniHeaderBytes[10] === 0x42 && civeniHeaderBytes[11] === 0x50;
          
          console.log("CIVENI header logo format - isPng:", isPng, "isJpg:", isJpg, "isWebP:", isWebP);
          
          if (isPng) {
            civeniHeaderLogoImage = await pdfDoc.embedPng(civeniHeaderBytes);
            console.log("CIVENI header logo embedded as PNG successfully");
            break;
          } else if (isJpg) {
            civeniHeaderLogoImage = await pdfDoc.embedJpg(civeniHeaderBytes);
            console.log("CIVENI header logo embedded as JPG successfully");
            break;
          } else if (isWebP) {
            console.log("CIVENI header logo is WebP format - NOT SUPPORTED, trying next URL");
            continue;
          } else {
            console.log("CIVENI header logo format unknown, trying next URL");
            continue;
          }
        } else {
          console.log("CIVENI header logo fetch failed with status:", civeniHeaderResponse.status);
        }
      } catch (urlError) {
        console.log("Error loading CIVENI header logo from URL:", civeniHeaderLogoUrl, urlError);
        continue;
      }
    }
    
    if (!civeniHeaderLogoImage) {
      console.log("FAILED to load CIVENI header logo from any URL - will display text fallback");
    }
  } catch (headerLogoError) {
    console.log("Could not load CIVENI header logo:", headerLogoError);
  }

  // ===== CARREGAR ASSINATURA DA ACILINA =====
  let signatureImage = null;
  try {
    const signatureUrl = "https://drive.google.com/uc?export=download&id=1r-vokG2OeDBViQuvWVFuGGqYLbu40FR3";
    console.log("Loading signature from:", signatureUrl);
    
    const signatureResponse = await fetch(signatureUrl);
    if (signatureResponse.ok) {
      const signatureBytes = new Uint8Array(await signatureResponse.arrayBuffer());
      console.log("Signature bytes length:", signatureBytes.length);
      
      const isPng = signatureBytes[0] === 0x89 && signatureBytes[1] === 0x50 && signatureBytes[2] === 0x4E && signatureBytes[3] === 0x47;
      const isJpg = signatureBytes[0] === 0xFF && signatureBytes[1] === 0xD8;
      
      if (isPng) {
        signatureImage = await pdfDoc.embedPng(signatureBytes);
        console.log("Signature embedded as PNG successfully");
      } else if (isJpg) {
        signatureImage = await pdfDoc.embedJpg(signatureBytes);
        console.log("Signature embedded as JPG successfully");
      }
    }
  } catch (sigError) {
    console.log("Could not load signature:", sigError);
  }

  // ===== TÍTULO PRINCIPAL =====
  // Usar texto com acentos corretos para português e espanhol
  const titleTextRaw = language === "en-US" ? "CERTIFICATE OF PARTICIPATION" 
    : language === "es-ES" ? "CERTIFICADO DE PARTICIPACIÓN"
    : language === "tr-TR" ? "KATILIM SERTIFIKASI"
    : "CERTIFICADO DE PARTICIPAÇÃO";
  const titleText = sanitizeForPdf(titleTextRaw);
  
  const titleSize = 28;
  const titleWidth = titleFont.widthOfTextAtSize(titleText, titleSize);
  
  // Calcular posições - VCCU logo esquerda, título centro, CIVENI logo direita
  const logoSize = 55;
  const civeniHeaderLogoSize = 50;
  const logoGap = 15;
  
  // Calcular largura total do conteúdo: VCCU logo + gap + título + gap + CIVENI logo
  const vccuWidth = vccuLogoImage ? logoSize + logoGap : 0;
  const civeniWidth = civeniHeaderLogoImage ? logoGap + civeniHeaderLogoSize * 2.5 : 0; // CIVENI logo é mais largo
  const totalContentWidth = vccuWidth + titleWidth + civeniWidth;
  const contentStartX = (width - totalContentWidth) / 2;
  
  // Desenhar logo VCCU se carregado (esquerda do título)
  if (vccuLogoImage) {
    const logoDims = vccuLogoImage.scale(logoSize / vccuLogoImage.height);
    const logoX = contentStartX;
    const logoY = headerY + (headerHeight - logoSize) / 2;
    
    page.drawImage(vccuLogoImage, {
      x: logoX,
      y: logoY,
      width: logoDims.width,
      height: logoDims.height,
    });
  }
  
  // Posição X do título (após o logo VCCU)
  const titleX = vccuLogoImage ? contentStartX + logoSize + logoGap : (width - titleWidth) / 2;
  
  page.drawText(titleText, {
    x: titleX,
    y: headerY + (headerHeight / 2) + 5,
    size: titleSize,
    font: titleFont,
    color: rgb(1, 1, 1),
  });
  
  // Desenhar logo CIVENI à direita do título (sem fundo branco)
  if (civeniHeaderLogoImage) {
    const civeniLogoDims = civeniHeaderLogoImage.scale(civeniHeaderLogoSize / civeniHeaderLogoImage.height);
    const civeniLogoX = titleX + titleWidth + logoGap;
    const civeniLogoY = headerY + (headerHeight - civeniLogoDims.height) / 2;
    
    page.drawImage(civeniHeaderLogoImage, {
      x: civeniLogoX,
      y: civeniLogoY,
      width: civeniLogoDims.width,
      height: civeniLogoDims.height,
    });
  }

  // ===== SUBTÍTULO DO EVENTO =====
  const subtitleTextRaw = "III CIVENI 2025 - International Multidisciplinary Congress";
  const subtitleText = sanitizeForPdf(subtitleTextRaw);
  const subtitleSize = 10;
  const subtitleWidth = textFont.widthOfTextAtSize(subtitleText, subtitleSize);
  
  page.drawText(subtitleText, {
    x: (width - subtitleWidth) / 2,
    y: headerY + 15,
    size: subtitleSize,
    font: textFont,
    color: rgb(1, 1, 1),
  });

  let currentY = headerY - 50;

  // ===== TEXTO "CERTIFICAMOS QUE" =====
  const certifyTextRaw = language === "en-US" ? "We hereby certify that"
    : language === "es-ES" ? "Certificamos que"
    : language === "tr-TR" ? "Isbu belge ile tasdik ederiz ki"
    : "Certificamos que";
  const certifyText = sanitizeForPdf(certifyTextRaw);
  
  const certifySize = 14;
  const certifyWidth = italicFont.widthOfTextAtSize(certifyText, certifySize);
  
  page.drawText(certifyText, {
    x: (width - certifyWidth) / 2,
    y: currentY,
    size: certifySize,
    font: italicFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  currentY -= 45;

  // ===== NOME DO PARTICIPANTE =====
  const sanitizedName = sanitizeForPdf(fullName.toUpperCase());
  const nameSize = 36;
  const nameWidth = titleFont.widthOfTextAtSize(sanitizedName, nameSize);
  
  page.drawText(sanitizedName, {
    x: (width - nameWidth) / 2,
    y: currentY,
    size: nameSize,
    font: titleFont,
    color: rgb(CIVENI_COLORS.blue.r, CIVENI_COLORS.blue.g, CIVENI_COLORS.blue.b),
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

  // ===== TEXTO PRINCIPAL - DESCRIÇÃO COMPLETA DO EVENTO =====
  const mainTextSize = 12;
  const maxTextWidth = width - 120; // Margem para texto
  
  // Texto principal completo traduzido nos 4 idiomas - Nome do evento em NEGRITO
  const certEventNameRaw = language === "en-US" 
    ? "III CIVENI - International Multidisciplinary Congress of VCCU"
    : language === "es-ES"
    ? "III CIVENI - Congreso Internacional Multidisciplinario de VCCU"
    : language === "tr-TR"
    ? "III CIVENI - VCCU Uluslararasi Multidisipliner Kongresi"
    : "III CIVENI - Congresso Internacional Multidisciplinar da VCCU";
  const certEventName = sanitizeForPdf(certEventNameRaw);

  const participationTextRaw = language === "en-US" 
    ? "For participation in the"
    : language === "es-ES"
    ? "Por la participación en el"
    : language === "tr-TR"
    ? "Katilimi icin:"
    : "Pela participação no";
  const participationText = sanitizeForPdf(participationTextRaw);

  // Desenhar texto de participação
  const participationWidth = textFont.widthOfTextAtSize(participationText, mainTextSize);
  page.drawText(participationText, {
    x: (width - participationWidth) / 2,
    y: currentY,
    size: mainTextSize,
    font: textFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 20;

  // Desenhar nome do evento em NEGRITO (usando titleFont que é bold)
  const certEventNameWidth = titleFont.widthOfTextAtSize(certEventName, mainTextSize + 1);
  page.drawText(certEventName, {
    x: (width - certEventNameWidth) / 2,
    y: currentY,
    size: mainTextSize + 1,
    font: titleFont,
    color: rgb(CIVENI_COLORS.blue.r, CIVENI_COLORS.blue.g, CIVENI_COLORS.blue.b),
  });

  currentY -= 20;

  // Tema do evento
  const mainTextLine2Raw = language === "en-US" 
    ? 'with the theme "Knowledge in Connection: Innovation, Justice and Humanity'
    : language === "es-ES"
    ? 'con el tema "Conocimiento en Conexión: Innovación, Justicia y Humanidad'
    : language === "tr-TR"
    ? '"Baglantida Bilgi: Cagdas Toplumda Inovasyon, Adalet ve Insanlik" temasinda,'
    : 'com o tema "Conhecimento em Conexão: Inovação, Justiça e Humanidade';
  const mainTextLine2 = sanitizeForPdf(mainTextLine2Raw);
  
  const mainTextWidth2 = textFont.widthOfTextAtSize(mainTextLine2, mainTextSize);
  
  page.drawText(mainTextLine2, {
    x: (width - mainTextWidth2) / 2,
    y: currentY,
    size: mainTextSize,
    font: textFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 20;

  // Continuação do tema - Parte 1 (antes do nome da universidade)
  const themeEndRaw = language === "en-US" 
    ? 'in Contemporary Society", promoted by'
    : language === "es-ES"
    ? 'en la Sociedad Contemporanea", promovido por la'
    : language === "tr-TR"
    ? "tarafindan duzenlenen:"
    : 'na Sociedade Contemporanea", promovido pela';
  const themeEnd = sanitizeForPdf(themeEndRaw);

  // Nome da universidade em NEGRITO
  const universityNameRaw = language === "en-US" 
    ? "Veni Creator Christian University,"
    : language === "es-ES"
    ? "Universidad Cristiana Veni Creator,"
    : language === "tr-TR"
    ? "Veni Creator Hristiyan Universitesi,"
    : "Universidade Crista Veni Creator,";
  const universityName = sanitizeForPdf(universityNameRaw);

  // Calcular larguras para centralizar todo o texto junto
  const themeEndWidth = textFont.widthOfTextAtSize(themeEnd, mainTextSize);
  const universityNameWidth = titleFont.widthOfTextAtSize(universityName, mainTextSize);
  const totalLine3Width = themeEndWidth + 5 + universityNameWidth;
  const line3StartX = (width - totalLine3Width) / 2;

  // Desenhar parte 1 (texto normal)
  page.drawText(themeEnd, {
    x: line3StartX,
    y: currentY,
    size: mainTextSize,
    font: textFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Desenhar nome da universidade em NEGRITO
  page.drawText(universityName, {
    x: line3StartX + themeEndWidth + 5,
    y: currentY,
    size: mainTextSize,
    font: titleFont,
    color: rgb(CIVENI_COLORS.blue.r, CIVENI_COLORS.blue.g, CIVENI_COLORS.blue.b),
  });

  currentY -= 20;

  // Data do evento - Parte 1 (antes das horas)
  const datePart1Raw = language === "en-US" 
    ? "from December 11 to 13, 2025, with a total workload of"
    : language === "es-ES"
    ? "del 11 al 13 de diciembre de 2025, con una carga horaria de"
    : language === "tr-TR"
    ? "11-13 Aralik 2025 tarihleri arasinda, toplam"
    : "de 11 a 13 de dezembro de 2025, com carga horária de";
  const datePart1 = sanitizeForPdf(datePart1Raw);
  
  // Horas em NEGRITO - remover sufixo "h" se existir no valor do banco
  const hoursValue = (hours || "60").replace(/h$/i, "").trim();
  const hoursTextRaw = `${hoursValue} ${language === "en-US" ? "hours" : language === "es-ES" ? "horas" : language === "tr-TR" ? "saat" : "horas"}.`;
  const hoursText = sanitizeForPdf(hoursTextRaw);
  
  // Calcular larguras
  const datePart1Width = textFont.widthOfTextAtSize(datePart1, mainTextSize);
  const hoursWidth = titleFont.widthOfTextAtSize(hoursText, mainTextSize);
  const totalLine4Width = datePart1Width + 4 + hoursWidth;
  
  // Desenhar parte 1 (texto normal)
  const line4StartX = (width - totalLine4Width) / 2;
  page.drawText(datePart1, {
    x: line4StartX,
    y: currentY,
    size: mainTextSize,
    font: textFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Desenhar horas em NEGRITO
  page.drawText(hoursText, {
    x: line4StartX + datePart1Width + 4,
    y: currentY,
    size: mainTextSize,
    font: titleFont,
    color: rgb(CIVENI_COLORS.blue.r, CIVENI_COLORS.blue.g, CIVENI_COLORS.blue.b),
  });

  // ===== FOOTER COM GRADIENTE =====
  const footerHeight = 65;
  const footerY = innerMargin;
  
  // Fundo do footer com gradiente
  for (let i = 0; i < headerSteps; i++) {
    const progress = i / headerSteps;
    let r, g, b;
    
    if (progress < 0.33) {
      const p = progress / 0.33;
      r = CIVENI_COLORS.blue.r + (CIVENI_COLORS.purple.r - CIVENI_COLORS.blue.r) * p;
      g = CIVENI_COLORS.blue.g + (CIVENI_COLORS.purple.g - CIVENI_COLORS.blue.g) * p;
      b = CIVENI_COLORS.blue.b + (CIVENI_COLORS.purple.b - CIVENI_COLORS.blue.b) * p;
    } else if (progress < 0.66) {
      r = CIVENI_COLORS.purple.r;
      g = CIVENI_COLORS.purple.g;
      b = CIVENI_COLORS.purple.b;
    } else {
      const p = (progress - 0.66) / 0.34;
      r = CIVENI_COLORS.purple.r + (CIVENI_COLORS.red.r - CIVENI_COLORS.purple.r) * p;
      g = CIVENI_COLORS.purple.g + (CIVENI_COLORS.red.g - CIVENI_COLORS.purple.g) * p;
      b = CIVENI_COLORS.purple.b + (CIVENI_COLORS.red.b - CIVENI_COLORS.purple.b) * p;
    }
    
    page.drawRectangle({
      x: innerMargin + i * stepWidth,
      y: footerY,
      width: stepWidth + 1,
      height: footerHeight,
      color: rgb(r, g, b),
    });
  }

  // ===== ASSINATURA ÚNICA CENTRALIZADA =====
  const sigY = 155; // Posição Y da assinatura (acima do logo CIVENI)
  
  const signatureName = sanitizeForPdf("Dr. Acilina Candeia");
  const signatureRole = sanitizeForPdf(language === "en-US" ? "President of VCCU" 
    : language === "es-ES" ? "Presidenta de VCCU"
    : language === "tr-TR" ? "VCCU Baskani"
    : "Presidente da VCCU");
  
  const sigX = width / 2; // Centralizado
  
  // Desenhar imagem da assinatura acima da linha
  if (signatureImage) {
    const sigImgHeight = 40;
    const sigImgDims = signatureImage.scale(sigImgHeight / signatureImage.height);
    page.drawImage(signatureImage, {
      x: sigX - sigImgDims.width / 2,
      y: sigY + 10,
      width: sigImgDims.width,
      height: sigImgDims.height,
    });
  }
  
  // Linha de assinatura
  page.drawLine({
    start: { x: sigX - 90, y: sigY + 5 },
    end: { x: sigX + 90, y: sigY + 5 },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  // Nome
  const sigNameWidth = titleFont.widthOfTextAtSize(signatureName, 10);
  page.drawText(signatureName, {
    x: sigX - sigNameWidth / 2,
    y: sigY - 12,
    size: 10,
    font: titleFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Cargo
  const sigRoleWidth = textFont.widthOfTextAtSize(signatureRole, 8);
  page.drawText(signatureRole, {
    x: sigX - sigRoleWidth / 2,
    y: sigY - 25,
    size: 8,
    font: textFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // ===== LOCAL E DATA NO FOOTER =====
  const locationText = sanitizeForPdf(`Celebration, Florida - USA, ${dateStr}`);
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

  // Logo CIVENI foi movida para o cabeçalho - não desenhar abaixo da assinatura

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

    // VALIDAÇÃO 1: Verificar se o e-mail existe na tabela de inscrições - buscar TODOS os registros
    const { data: registrations, error: registrationError } = await supabase
      .from("event_registrations")
      .select("id, email, full_name, payment_status, stripe_session_id")
      .ilike("email", normalizedEmail);

    if (registrationError) {
      console.error("Error checking registration:", registrationError);
    }

    if (!registrations || registrations.length === 0) {
      console.log("Email not found in registrations:", normalizedEmail);
      return new Response(
        JSON.stringify({
          success: false,
          message: msg.emailNotRegistered,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log(`[issue-certificate] Found ${registrations.length} registration(s) for email:`, normalizedEmail);

    // Primeiro, verificar se algum registro já tem payment_status = 'completed'
    let validRegistration = registrations.find(r => r.payment_status === "completed");

    // Se nenhum registro está 'completed', verificar cada stripe_session_id no Stripe
    if (!validRegistration) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      for (const reg of registrations) {
        if (reg.stripe_session_id) {
          try {
            const session = await stripe.checkout.sessions.retrieve(reg.stripe_session_id);

            console.log(
              "[issue-certificate] Checking Stripe session:",
              reg.stripe_session_id,
              "payment_status=",
              session.payment_status,
            );

            if (session.payment_status === "paid") {
              // Atualizar este registro para 'completed'
              const { error: updateError } = await supabase
                .from("event_registrations")
                .update({
                  payment_status: "completed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", reg.id);

              if (updateError) {
                console.error(
                  "[issue-certificate] Failed to update registration payment_status:",
                  updateError,
                );
              } else {
                console.log("[issue-certificate] Updated registration", reg.id, "to completed");
              }

              validRegistration = { ...reg, payment_status: "completed" };
              break; // Encontrou um pagamento válido, parar a busca
            }
          } catch (err) {
            console.error(
              "[issue-certificate] Stripe verification failed for session:",
              reg.stripe_session_id,
              err,
            );
          }
        }
      }
    }

    if (!validRegistration) {
      console.log(
        "Email found but no completed payment in any registration:",
        normalizedEmail,
        "Total registrations:",
        registrations.length,
      );
      return new Response(
        JSON.stringify({
          success: false,
          message: msg.emailNotRegistered,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log("Valid registration found for email:", normalizedEmail, "Name:", validRegistration.full_name);

    // VALIDAÇÃO 2: Verificar palavras-chave
    const normalizedUserKeywords = keywords.map(normalizeText);
    const normalizedOfficialKeywords = (eventCert.keywords || []).map(normalizeText);

    console.log("[issue-certificate] User keywords:", keywords, "normalized:", normalizedUserKeywords);
    console.log("[issue-certificate] Official keywords:", eventCert.keywords, "normalized:", normalizedOfficialKeywords);

    const matchedCount = normalizedUserKeywords.filter((userKw) =>
      normalizedOfficialKeywords.includes(userKw) && userKw.length > 0
    ).length;

    console.log("[issue-certificate] matchedCount=", matchedCount, "required=", eventCert.required_correct);

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

    const eventTitle = translation?.titulo || event?.slug || "CIVENI 2025";
    console.log("Event title for certificate:", eventTitle);

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
      eventName: eventTitle,
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
          eventName: eventTitle,
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
        eventName: eventTitle,
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
