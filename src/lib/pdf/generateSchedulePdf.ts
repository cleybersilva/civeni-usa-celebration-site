import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';

interface PdfTranslations {
  title: string;
  subtitlePresencial: string;
  subtitleOnline: string;
  timezoneObs: string;
  schedule: string;
  day: string;
  date: string;
  time: string;
  activity: string;
  speakerOrigin: string;
  place: string;
  break: string;
  closing: string;
}

const translations: Record<string, PdfTranslations> = {
  pt: {
    title: "III CIVENI 2025 – PROGRAMAÇÃO OFICIAL",
    subtitlePresencial: "Programação Presencial",
    subtitleOnline: "Programação Online",
    timezoneObs: "*Horários em America/Fortaleza (GMT-3). Programação sujeita a ajustes.",
    schedule: "Programação",
    day: "Dia",
    date: "Data",
    time: "Horário",
    activity: "Atividade",
    speakerOrigin: "Palestrante / Origem",
    place: "Local",
    break: "Intervalo",
    closing: "Encerramento do Dia"
  },
  en: {
    title: "III CIVENI 2025 – OFFICIAL SCHEDULE",
    subtitlePresencial: "In-Person Schedule",
    subtitleOnline: "Online Schedule",
    timezoneObs: "*Times in America/Fortaleza (GMT-3). Schedule subject to changes.",
    schedule: "Schedule",
    day: "Day",
    date: "Date",
    time: "Time",
    activity: "Activity",
    speakerOrigin: "Speaker / Origin",
    place: "Location",
    break: "Break",
    closing: "Day Closing"
  },
  es: {
    title: "III CIVENI 2025 – PROGRAMACIÓN OFICIAL",
    subtitlePresencial: "Programación Presencial",
    subtitleOnline: "Programación Online",
    timezoneObs: "*Horarios en America/Fortaleza (GMT-3). Programación sujeta a cambios.",
    schedule: "Programación",
    day: "Día",
    date: "Fecha",
    time: "Horario",
    activity: "Actividad",
    speakerOrigin: "Ponente / Origen",
    place: "Lugar",
    break: "Descanso",
    closing: "Cierre del Día"
  },
  tr: {
    title: "III CIVENI 2025 – RESMİ PROGRAM",
    subtitlePresencial: "Yüz Yüze Program",
    subtitleOnline: "Çevrimiçi Program",
    timezoneObs: "*Saatler America/Fortaleza (GMT-3) saat dilimindedir. Program değişikliğe tabidir.",
    schedule: "Program",
    day: "Gün",
    date: "Tarih",
    time: "Saat",
    activity: "Etkinlik",
    speakerOrigin: "Konuşmacı / Köken",
    place: "Yer",
    break: "Ara",
    closing: "Gün Kapanışı"
  }
};

interface Session {
  id: string;
  title: string;
  start_at: string;
  end_at: string | null;
  session_type: string;
  room: string | null;
  description: string | null;
}

interface Day {
  id: string;
  date: string;
  weekday_label: string;
  headline: string;
  location: string | null;
}

const formatTime = (datetime: string | null): string => {
  if (!datetime) return '';
  const match = datetime.match(/T(\d{2}:\d{2})|(\d{2}:\d{2})/);
  if (match) {
    return match[1] || match[2];
  }
  return datetime.substring(0, 5);
};

const formatDate = (dateStr: string, lang: string): string => {
  const date = new Date(dateStr + 'T12:00:00');
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  };
  
  const locales: Record<string, string> = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES',
    tr: 'tr-TR'
  };
  
  return date.toLocaleDateString(locales[lang] || 'pt-BR', options);
};

async function fetchScheduleData(modalidade: 'presencial' | 'online'): Promise<{ days: Day[], sessions: Session[] }> {
  const eventSlug = modalidade === 'presencial' 
    ? 'iii-civeni-2025' 
    : 'iii-civeni-2025-online';

  const { data: days, error: daysError } = await supabase
    .from('civeni_program_days')
    .select('*')
    .eq('event_slug', eventSlug)
    .eq('is_published', true)
    .order('sort_order');

  if (daysError) throw new Error(`Error fetching days: ${daysError.message}`);

  const { data: sessions, error: sessionsError } = await supabase
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

  if (sessionsError) throw new Error(`Error fetching sessions: ${sessionsError.message}`);

  return { 
    days: days || [], 
    sessions: sessions || [] 
  };
}

function generatePdfHtml(
  days: Day[], 
  sessions: Session[], 
  modalidade: 'presencial' | 'online',
  lang: string
): string {
  const t = translations[lang] || translations.pt;
  const subtitle = modalidade === 'presencial' ? t.subtitlePresencial : t.subtitleOnline;
  
  let daysHtml = '';
  
  days.forEach((day, index) => {
    const daySessions = sessions.filter((s: any) => s.day_id === day.id);
    
    let sessionsHtml = '';
    daySessions.forEach(session => {
      const startTime = formatTime(session.start_at);
      const endTime = formatTime(session.end_at);
      const timeRange = endTime ? `${startTime} - ${endTime}` : startTime;
      
      sessionsHtml += `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 500; white-space: nowrap; width: 120px;">
            ${timeRange}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
            <strong>${session.title}</strong>
            ${session.description ? `<br><span style="color: #6b7280; font-size: 12px;">${session.description}</span>` : ''}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${session.session_type || '-'}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
            ${session.room || day.location || '-'}
          </td>
        </tr>
      `;
    });
    
    daysHtml += `
      <div style="margin-bottom: 32px; page-break-inside: avoid;">
        <div style="background: linear-gradient(135deg, #021b3a 0%, #731b4c 50%, #c51d3b 100%); color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">
            ${t.day} ${index + 1} - ${day.weekday_label}
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">
            ${formatDate(day.date, lang)} • ${day.headline}
          </p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; font-size: 13px; border-bottom: 2px solid #e5e7eb;">
                ${t.time}
              </th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; font-size: 13px; border-bottom: 2px solid #e5e7eb;">
                ${t.activity}
              </th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; font-size: 13px; border-bottom: 2px solid #e5e7eb;">
                ${t.speakerOrigin}
              </th>
              <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; font-size: 13px; border-bottom: 2px solid #e5e7eb;">
                ${t.place}
              </th>
            </tr>
          </thead>
          <tbody>
            ${sessionsHtml || `<tr><td colspan="4" style="padding: 24px; text-align: center; color: #9ca3af;">-</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1f2937;
          line-height: 1.5;
          background: #f3f4f6;
        }
        @page {
          margin: 10mm;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #021b3a 0%, #731b4c 50%, #c51d3b 100%); color: white; padding: 32px; text-align: center; margin-bottom: 24px; border-radius: 8px;">
        <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;">
          ${t.title}
        </h1>
        <p style="font-size: 18px; opacity: 0.95; margin-bottom: 8px;">
          ${subtitle}
        </p>
        <p style="font-size: 12px; opacity: 0.8;">
          ${t.timezoneObs}
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 0 16px;">
        ${daysHtml || `<p style="text-align: center; color: #6b7280; padding: 48px;">-</p>`}
      </div>
      
      <!-- Footer -->
      <div style="background: linear-gradient(135deg, #021b3a 0%, #731b4c 50%, #c51d3b 100%); color: white; padding: 16px 24px; text-align: center; margin-top: 32px; border-radius: 8px;">
        <p style="font-size: 12px; opacity: 0.9;">
          © 2025 CIVENI - Congresso Internacional Virtual de Educação e Inovação
        </p>
        <p style="font-size: 11px; opacity: 0.7; margin-top: 4px;">
          www.civeni.com
        </p>
      </div>
    </body>
    </html>
  `;
}

export async function generateSchedulePdf(
  modalidade: 'presencial' | 'online',
  lang: string
): Promise<void> {
  try {
    // Fetch real-time data
    const { days, sessions } = await fetchScheduleData(modalidade);
    
    // Generate HTML
    const htmlContent = generatePdfHtml(days, sessions, modalidade, lang);
    
    // Create container element
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);
    
    // Generate PDF
    const opt = {
      margin: 10,
      filename: `civeni_programacao_${modalidade}_${lang}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm' as const, 
        format: 'a4', 
        orientation: 'portrait' as const
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const }
    };
    
    await html2pdf().set(opt).from(container).save();
    
    // Clean up
    document.body.removeChild(container);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
