import { supabase } from "@/integrations/supabase/client";
import type { ProgramacaoDia, ProgramacaoAtividade } from "@/types/programacao";

export async function fetchProgramacaoData(modalidade: 'presencial' | 'online'): Promise<ProgramacaoDia[]> {
  // Determinar event_slug baseado na modalidade
  const eventSlug = modalidade === 'presencial' 
    ? 'iii-civeni-2025' 
    : 'iii-civeni-2025-online';

  // Buscar dias
  const { data: days, error: daysError } = await supabase
    .from('civeni_program_days')
    .select('*')
    .eq('event_slug', eventSlug)
    .eq('is_published', true)
    .order('sort_order');

  if (daysError) throw new Error(`Erro ao buscar dias: ${daysError.message}`);
  if (!days || days.length === 0) throw new Error('Nenhum dia de programação encontrado');

  // Buscar sessões com palestrantes
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

  if (sessionsError) throw new Error(`Erro ao buscar sessões: ${sessionsError.message}`);

  // Montar estrutura de dados para o PDF
  const programacao: ProgramacaoDia[] = days.map(day => {
    const daySessions = sessions?.filter(session => session.day_id === day.id) || [];
    
    const atividades: ProgramacaoAtividade[] = daySessions.map(session => {
      // Parse do horário garantindo timezone de Brasília
      const startDate = new Date(session.start_at);
      const startTime = startDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Fortaleza',
        hour12: false
      });
      
      let horario = startTime;
      if (session.end_at) {
        const endDate = new Date(session.end_at);
        const endTime = endDate.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Fortaleza',
          hour12: false
        });
        horario = `${startTime} - ${endTime}`;
      }
      
      // Formatar palestrantes
      let palestranteOrigem = '';
      if (session.civeni_session_speakers && session.civeni_session_speakers.length > 0) {
        palestranteOrigem = session.civeni_session_speakers
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
      
      // Se não houver palestrantes, usar descrição ou tipo de sessão
      if (!palestranteOrigem) {
        palestranteOrigem = session.description || session.session_type || '';
      }
      
      return {
        horario,
        atividade: session.title,
        palestranteOrigem,
        local: session.room || day.location || ''
      };
    });
    
    return {
      tituloDia: `${day.weekday_label} - ${day.headline}`,
      data: new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      modalidade,
      atividades
    };
  });

  return programacao;
}
