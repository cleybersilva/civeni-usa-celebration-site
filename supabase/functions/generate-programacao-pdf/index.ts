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
    var eventSlug, settingsId;
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
    const { data: days, error: daysError } = await supabase
      .from('civeni_program_days')
      .select('*')
      .eq('event_slug', eventSlug)
      .eq('is_published', true)
      .order('sort_order');

    console.log(`Days found: ${days?.length || 0}`);
    if (daysError) console.error('Error fetching days:', daysError);
    if (days && days.length > 0) {
      console.log('First day:', JSON.stringify(days[0]));
    }

    // Get sessions with speakers
    const { data: sessions, error: sessionsError } = await supabase
      .from('civeni_program_sessions')
      .select(`
        *,
        civeni_program_days!inner (
          event_slug
        ),
        civeni_session_speakers (
          speaker_id,
          role,
          civeni_speakers (
            name,
            affiliation,
            title
          )
        )
      `)
      .eq('civeni_program_days.event_slug', eventSlug)
      .eq('is_published', true)
      .order('order_in_day');

    console.log(`Sessions found: ${sessions?.length || 0}`);
    if (sessionsError) console.error('Error fetching sessions:', sessionsError);
    if (sessions && sessions.length > 0) {
      console.log('First session:', JSON.stringify(sessions[0]));
    }

    if (!days || days.length === 0) {
      console.log('No days found for', modalidade);
      // Generate PDF with "not published" message
      const emptyHtml = generateEmptyProgramHtml(modalidade, bannerUrl);
      const pdfBytes = await generatePdfFromHtml(emptyHtml);
      
    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="civeni-programacao-${modalidade}-${getCurrentDateString()}.html"`,
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
    
    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="civeni-programacao-${modalidade}-${getCurrentDateString()}.html"`,
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
  const currentDate = new Date().toLocaleString('pt-BR', { 
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
  <header class="banner" style="background-image: url('${bannerUrl}');">
    <div class="banner-title">
      <div class="micro">III CIVENI – Programa Oficial</div>
      <div class="macro">Programação ${modalidadeTitle}</div>
      <div class="meta">Fortaleza/CE • Atualizado em ${currentDate} (GMT-3)</div>
    </div>
  </header>

  <div class="content">
    <div class="empty-content">
      <div class="empty-icon">📅</div>
      <h2 class="empty-title">Programação ainda não publicada</h2>
      <p class="empty-message">
        A programação ${modalidade} ainda não foi disponibilizada. <br>
        Acesse o site para acompanhar as atualizações.
      </p>
    </div>
  </div>`;
}

function generateProgramHtml(modalidade: string, days: any[], settings: any, bannerUrl: string): string {
  const modalidadeTitle = modalidade === 'presencial' ? 'PRESENCIAL' : 'ONLINE';
  const pageTitle = settings?.page_title || `Programação ${modalidadeTitle}`;
  const currentDate = new Date().toLocaleString('pt-BR', { 
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
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
      
      // Format speakers
      let speakersText = '';
      if (session.civeni_session_speakers && session.civeni_session_speakers.length > 0) {
        speakersText = session.civeni_session_speakers
          .map((ss: any) => {
            const speaker = ss.civeni_speakers;
            if (speaker) {
              const parts = [speaker.name];
              if (speaker.affiliation) parts.push(speaker.affiliation);
              return parts.join(' - ');
            }
            return '';
          })
          .filter((s: string) => s)
          .join(', ');
      }
      
      return `
        <tr>
          <td class="time-cell">${timeRange}</td>
          <td class="title-cell">
            <div class="session-title">${session.title}</div>
            ${session.description ? `<div class="session-description">${session.description}</div>` : ''}
          </td>
          <td class="speaker-cell">${speakersText}</td>
          <td class="location-cell">${session.room || day.location || ''}</td>
        </tr>
      `;
    }).join('');
    
    const dayDate = new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR');
    
    return `
      <div class="day-section">
        <h2 class="day-title">${day.weekday_label} – ${day.headline} – ${dayDate}</h2>
        <table class="sessions-table" aria-label="Programação do dia">
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
  <header class="banner" style="background-image: url('${bannerUrl}');">
    <div class="banner-title">
      <div class="micro">III CIVENI – Programa Oficial</div>
      <div class="macro">Programação ${modalidadeTitle}</div>
      <div class="meta">Fortaleza/CE • Atualizado em ${currentDate} (GMT-3)</div>
    </div>
  </header>

  <div class="content">
    ${daysHtml}
  </div>`;
}

async function generatePdfFromHtml(html: string): Promise<Uint8Array> {
  try {
    // Generate complete HTML with proper styling for PDF conversion
    const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Programação III CIVENI 2025</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4; 
      margin: 0; 
    }
    
    :root {
      --brand-primary: hsl(210, 100%, 45%);
      --brand-secondary: hsl(0, 85%, 55%);
      --text-primary: hsl(220, 13%, 13%);
      --text-muted: hsl(220, 9%, 46%);
      --bg-white: hsl(0, 0%, 100%);
      --bg-soft: hsl(210, 20%, 98%);
      --gradient-primary: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      --gradient-sidebar: linear-gradient(180deg, var(--brand-primary), var(--brand-secondary));
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Poppins', system-ui, sans-serif;
      color: var(--text-primary);
      background: var(--bg-white);
      line-height: 1.6;
      font-size: 11pt;
      padding-bottom: 80px;
      margin-left: 8px;
    }
    
    .side-stripe {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 6px;
      background: var(--gradient-sidebar);
      z-index: 1000;
    }
    
    .banner {
      position: relative;
      height: 140px;
      background: var(--gradient-primary);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;
      padding: 24px;
      margin-bottom: 40px;
      overflow: hidden;
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
      margin-bottom: 2px;
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
      margin-top: 4px;
    }
    
    .content {
      padding: 0 30px 100px 36px;
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
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      font-size: 10.5pt;
    }
    
    .sessions-table tr:nth-child(even) {
      background: #fafafa;
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
      color: var(--text-primary);
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
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 70px;
      background: var(--bg-soft);
      border-top: 2px solid var(--brand-primary);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 30px 12px 36px;
      font-size: 9pt;
      color: var(--text-muted);
      text-align: center;
    }
    
    .footer-logo {
      font-weight: 700;
      color: var(--brand-primary);
      margin-bottom: 6px;
      font-size: 11pt;
    }
    
    .footer-info {
      line-height: 1.3;
    }
    
    .empty-content {
      text-align: center;
      padding: 60px 30px;
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
      
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="side-stripe"></div>
  ${html}
  
  <div class="footer">
    <div class="footer-logo">III CIVENI 2025</div>
    <div class="footer-info">
      *Horários em America/Fortaleza (GMT-3). Programação sujeita a ajustes.<br>
      A versão mais atual está em iiiciveni.com.br
    </div>
  </div>
</body>
</html>`;
    
    return new TextEncoder().encode(fullHtml);
    
  } catch (error) {
    console.error('Error generating PDF HTML:', error);
    throw error;
  }
}