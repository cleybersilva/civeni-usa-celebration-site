import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabsContent } from '@/components/ui/tabs';
import SessionCard from './SessionCard';

const parseBrazilDateTime = (value: string): Date | null => {
  if (!value) return null;
  try {
    const match = value.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (match) {
      const [, datePart, timePart] = match;
      return new Date(`${datePart}T${timePart}:00-03:00`);
    }
    return new Date(value);
  } catch {
    return null;
  }
};
interface Session {
  id: string;
  start_at: string;
  end_at?: string;
  session_type: string;
  title: string;
  description?: string;
  room?: string;
  modality: string;
  is_parallel: boolean;
  is_featured: boolean;
  livestream_url?: string;
  materials_url?: string;
}

interface Day {
  id: string;
  date: string;
  weekday_label: string;
  headline: string;
  theme: string;
}

interface DayTimelineProps {
  day: Day;
  sessions: Session[];
}

const DayTimeline: React.FC<DayTimelineProps> = ({ day, sessions }) => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const dayDate = new Date(day.date + 'T00:00:00');
  const isToday = dayDate.toDateString() === now.toDateString();

  const getLocale = () => {
    const lang = i18n.language;
    if (lang === 'pt') return 'pt-BR';
    if (lang === 'es') return 'es-ES';
    if (lang === 'tr') return 'tr-TR';
    return 'en-US';
  };

  const translateWeekday = (weekdayLabel: string) => {
    const weekdayMap: Record<string, string> = {
      'Segunda-feira': t('schedule.weekdays.monday'),
      'Terça-feira': t('schedule.weekdays.tuesday'),
      'Quarta-feira': t('schedule.weekdays.wednesday'),
      'Quinta-feira': t('schedule.weekdays.thursday'),
      'Sexta-feira': t('schedule.weekdays.friday'),
      'Sábado': t('schedule.weekdays.saturday'),
      'Domingo': t('schedule.weekdays.sunday'),
    };
    return weekdayMap[weekdayLabel] || weekdayLabel;
  };

  const getCurrentSessionStatus = (session: Session) => {
    if (!isToday) return null;
    
    const sessionStart = parseBrazilDateTime(session.start_at) || new Date(session.start_at);
    const sessionEnd = session.end_at
      ? parseBrazilDateTime(session.end_at) || new Date(session.end_at)
      : new Date(sessionStart.getTime() + 60 * 60 * 1000);
    
    if (now >= sessionStart && now <= sessionEnd) {
      return 'live';
    }
    
    // Check if this is the next session (within 30 minutes)
    const timeDiff = sessionStart.getTime() - now.getTime();
    if (timeDiff > 0 && timeDiff <= 30 * 60 * 1000) {
      return 'next';
    }
    
    return null;
  };

  return (
    <TabsContent value={day.id} className="space-y-6 mt-0">
      <div className="text-center py-6 bg-gradient-to-br from-civeni-blue to-civeni-red rounded-b-lg text-white">
        <h2 className="text-2xl font-bold text-white mb-2">
          {day.headline}
        </h2>
        <p className="text-white/90 text-lg">
          {day.theme}
        </p>
        <div className="text-sm text-white/80 mt-2">
          {translateWeekday(day.weekday_label)}, {new Date(day.date + 'T00:00:00').toLocaleDateString(getLocale())}
        </div>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('schedule.noSessionsForDay')}
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const status = getCurrentSessionStatus(session);
            return (
              <SessionCard
                key={session.id}
                session={session}
                isLive={status === 'live'}
                isNext={status === 'next'}
              />
            );
          })
        )}
      </div>
    </TabsContent>
  );
};

export default DayTimeline;