import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const modalidade = url.searchParams.get('modalidade');

    if (!modalidade || !['presencial', 'online'].includes(modalidade)) {
      return new Response(JSON.stringify({ error: 'Modalidade deve ser "presencial" ou "online"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating PDF for modalidade: ${modalidade}`);

    // Get banner from banner_slides
    const { data: bannerData } = await supabase
      .from('banner_slides')
      .select('bg_image')
      .eq('is_active', true)
      .order('order_index')
      .limit(1)
      .single();

    const bannerUrl = bannerData?.bg_image || '';

    // Get program data based on modalidade
    let eventSlug, settingsId;
    if (modalidade === 'presencial') {
      eventSlug = 'iii-civeni-2025';
      settingsId = 1;
    } else {
      eventSlug = 'iii-civeni-2025-online';
      settingsId = 2;
    }

    // Get settings
    const { data: settings } = await supabase
      .from('civeni_program_settings')
      .select('*')
      .eq('id', settingsId)
      .single();

    // Get days
    const { data: days } = await supabase
      .from('civeni_program_days')
      .select('*')
      .eq('event_slug', eventSlug)
      .eq('is_published', true)
      .order('sort_order');

    // Get sessions
    const { data: sessions } = await supabase
      .from('civeni_program_sessions')
      .select(`
        *,
        civeni_program_days!inner (
          event_slug
        )
      `)
      .eq('civeni_program_days.event_slug', eventSlug)
      .eq('is_published', true)
      .order('order_in_day');

    if (!days || days.length === 0) {
      console.log('No days found for', modalidade);
      // Generate PDF with "not published" message
      const emptyHtml = generateEmptyProgramHtml(modalidade, bannerUrl);
      const pdfBytes = await generatePdfFromHtml(emptyHtml);
      
      return new Response(pdfBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="civeni-programacao-${modalidade}-${getCurrentDateString()}.html"`,
          'Cache-Control': 'no-store'
        },
      });
    }

    // Organize sessions by day
    const daysWithSessions = days.map(day => ({
      ...day,
      sessions: sessions?.filter(session => session.day_id === day.id) || []
    }));

    // Generate HTML template
    const html = generateProgramHtml(
      modalidade,
      daysWithSessions,
      settings,
      bannerUrl
    );

    console.log('Generating PDF from HTML...');
    const pdfBytes = await generatePdfFromHtml(html);

    const filename = `civeni-programacao-${modalidade}-${getCurrentDateString()}.pdf`;
    
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function generateEmptyProgramHtml(modalidade: string, bannerUrl: string): string {
  const modalidadeTitle = modalidade === 'presencial' ? 'PRESENCIAL' : 'ONLINE';
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Programação ${modalidadeTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --brand-primary: hsl(210, 100%, 45%);
      --brand-secondary: hsl(0, 85%, 55%);
      --text-primary: hsl(220, 13%, 13%);
      --text-muted: hsl(220, 9%, 46%);
      --bg-white: hsl(0, 0%, 100%);
      --bg-soft: hsl(210, 20%, 98%);
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Poppins', system-ui, sans-serif;
      color: var(--text-primary);
      background: var(--bg-white);
      line-height: 1.6;
    }
    
    .side-stripe {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      background: linear-gradient(180deg, var(--brand-primary), var(--brand-secondary));
    }
    
    .banner {
      position: relative;
      height: 140px;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      background-image: url('${bannerUrl}');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .banner::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
    }
    
    .banner-title {
      position: relative;
      z-index: 10;
      color: white;
    }
    
    .micro {
      font-size: 10px;
      opacity: 0.9;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 1px;
    }
    
    .macro {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.2px;
      margin: 4px 0;
    }
    
    .meta {
      font-size: 11px;
      opacity: 0.95;
      font-weight: 400;
    }
    
    .content {
      padding: 40px 24px;
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .empty-icon {
      font-size: 64px;
      margin-bottom: 24px;
      opacity: 0.3;
    }
    
    .empty-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--brand-primary);
      margin-bottom: 16px;
    }
    
    .empty-message {
      font-size: 16px;
      color: var(--text-muted);
      margin-bottom: 32px;
    }
    
    .footer {
      margin-top: 60px;
      padding: 20px 24px;
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="side-stripe"></div>
  
  <header class="banner">
    <div class="banner-title">
      <div class="micro">III CIVENI – Programa Oficial</div>
      <div class="macro">Programação ${modalidadeTitle}</div>
      <div class="meta">Fortaleza/CE • Atualizado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })} (GMT-3)</div>
    </div>
  </header>

  <div class="content">
    <div class="empty-icon">📅</div>
    <h2 class="empty-title">Programação ainda não publicada</h2>
    <p class="empty-message">
      A programação ${modalidade} ainda não foi disponibilizada. <br>
      Acesse o site para acompanhar as atualizações.
    </p>
  </div>

  <div class="footer">
    *Horários em America/Fortaleza (GMT-3). Programação sujeita a ajustes. <br>
    A versão mais atual está em https://iiiciveni.com.br/programacao-${modalidade}
  </div>
</body>
</html>`;
}

function generateProgramHtml(modalidade: string, days: any[], settings: any, bannerUrl: string): string {
  const modalidadeTitle = modalidade === 'presencial' ? 'PRESENCIAL' : 'ONLINE';
  const pageTitle = settings?.page_title || `Programação ${modalidadeTitle}`;
  
  const daysHtml = days.map(day => {
    const sessionsHtml = day.sessions.map((session: any) => {
      const startTime = new Date(session.start_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Fortaleza'
      });
      const endTime = session.end_at ? new Date(session.end_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Fortaleza'
      }) : '';
      
      const timeRange = endTime ? `${startTime}–${endTime}` : startTime;
      
      return `
        <tr>
          <td class="time-cell">${timeRange}</td>
          <td class="title-cell">
            <div class="session-title">${session.title}</div>
            ${session.description ? `<div class="session-description">${session.description}</div>` : ''}
          </td>
          <td class="speaker-cell">${session.speaker_names || ''}</td>
          <td class="location-cell">${session.room || session.location || ''}</td>
        </tr>
      `;
    }).join('');
    
    const dayDate = new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR');
    
    return `
      <div class="day-section">
        <h2 class="day-title">${day.weekday_label} – ${day.headline} – ${dayDate}</h2>
        <table class="sessions-table">
          <thead>
            <tr>
              <th>Horário</th>
              <th>Atividade</th>
              <th>Palestrante/Origem</th>
              <th>${modalidade === 'online' ? 'Sala Virtual' : 'Local'}</th>
            </tr>
          </thead>
          <tbody>
            ${sessionsHtml}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${pageTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --brand-primary: hsl(210, 100%, 45%);
      --brand-secondary: hsl(0, 85%, 55%);
      --text-primary: hsl(220, 13%, 13%);
      --text-muted: hsl(220, 9%, 46%);
      --bg-white: hsl(0, 0%, 100%);
      --bg-soft: hsl(210, 20%, 98%);
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Poppins', system-ui, sans-serif;
      color: var(--text-primary);
      background: var(--bg-white);
      line-height: 1.6;
      font-size: 11pt;
    }
    
    .side-stripe {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      background: linear-gradient(180deg, var(--brand-primary), var(--brand-secondary));
    }
    
    .banner {
      position: relative;
      height: 140px;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      background-image: url('${bannerUrl}');
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .banner::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
    }
    
    .banner-title {
      position: relative;
      z-index: 10;
      color: white;
    }
    
    .micro {
      font-size: 10px;
      opacity: 0.9;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 1px;
    }
    
    .macro {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.2px;
      margin: 4px 0;
    }
    
    .meta {
      font-size: 11px;
      opacity: 0.95;
      font-weight: 400;
    }
    
    .content {
      padding: 0 24px;
    }
    
    .day-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .day-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--brand-primary);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--brand-primary);
    }
    
    .sessions-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      background: var(--bg-white);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .sessions-table th {
      background: var(--bg-soft);
      color: var(--text-primary);
      font-weight: 600;
      font-size: 10pt;
      padding: 12px 8px;
      text-align: left;
      border-bottom: 2px solid var(--brand-primary);
    }
    
    .sessions-table td {
      padding: 12px 8px;
      vertical-align: top;
      border-bottom: 1px solid #eee;
    }
    
    .sessions-table tr:nth-child(even) {
      background: #fafafa;
    }
    
    .sessions-table tr:hover {
      background: var(--bg-soft);
    }
    
    .time-cell {
      font-weight: 600;
      color: var(--brand-primary);
      white-space: nowrap;
      width: 80px;
      font-size: 10pt;
    }
    
    .title-cell {
      width: 40%;
    }
    
    .session-title {
      font-weight: 600;
      font-size: 11pt;
      margin-bottom: 4px;
    }
    
    .session-description {
      font-size: 9.5pt;
      color: var(--text-muted);
      line-height: 1.4;
    }
    
    .speaker-cell {
      color: var(--text-muted);
      font-size: 10pt;
      width: 25%;
    }
    
    .location-cell {
      color: var(--text-muted);
      font-size: 10pt;
      width: 15%;
    }
    
    .footer {
      margin-top: 60px;
      padding: 20px 24px;
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
      border-top: 1px solid #eee;
    }
    
    .footer-logo {
      font-weight: 700;
      color: var(--brand-primary);
      margin-bottom: 8px;
    }
    
    @media print {
      .day-section {
        page-break-inside: avoid;
      }
      
      .sessions-table {
        page-break-inside: avoid;
      }
      
      .sessions-table tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="side-stripe"></div>
  
  <header class="banner">
    <div class="banner-title">
      <div class="micro">III CIVENI – Programa Oficial</div>
      <div class="macro">Programação ${modalidadeTitle}</div>
      <div class="meta">Fortaleza/CE • Atualizado em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })} (GMT-3)</div>
    </div>
  </header>

  <div class="content">
    ${daysHtml}
  </div>

  <div class="footer">
    <div class="footer-logo">III CIVENI 2025</div>
    <div>*Horários em America/Fortaleza (GMT-3). Programação sujeita a ajustes.</div>
    <div>A versão mais atual está em https://iiiciveni.com.br/programacao-${modalidade}</div>
  </div>
</body>
</html>`;
}

async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  try {
    // Use jsPDF to generate actual PDF
    const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
    
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('Programação III CIVENI 2025', 20, 30);
    
    // Parse HTML content to extract text (simple approach)
    const textContent = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split text into lines that fit the page width
    const lines = pdf.splitTextToSize(textContent, 170); // 170mm width
    let yPosition = 50;
    
    pdf.setFontSize(10);
    
    // Add lines to PDF with page breaks
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > 280) { // Near bottom of page
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(lines[i], 20, yPosition);
      yPosition += 5;
    }
    
    // Add footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Página ${i} de ${pageCount} - III CIVENI 2025`, 20, 290);
    }
    
    // Return PDF as Uint8Array
    const pdfOutput = pdf.output('arraybuffer');
    return new Uint8Array(pdfOutput);
    
  } catch (error) {
    console.error('Error generating PDF with jsPDF:', error);
    
    // Fallback: create a simple text-based PDF using basic approach
    const simpleContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 700 Td
(Programação III CIVENI 2025) Tj
0 -20 Td
(Erro na geração do PDF. Acesse o site para ver a programação.) Tj
0 -20 Td
(https://iiiciveni.com.br) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000526 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
625
%%EOF`;
    
    return new TextEncoder().encode(simpleContent);
  }
}