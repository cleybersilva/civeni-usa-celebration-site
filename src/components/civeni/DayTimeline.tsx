import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';
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
  const now = new Date();
  const dayDate = new Date(day.date + 'T00:00:00');
  const isToday = dayDate.toDateString() === now.toDateString();

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
      {/* Day Header - Premium Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-lg bg-gradient-to-br from-card via-card to-muted/30 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-semibold mb-4">
            <Calendar className="w-3 h-3 md:w-4 md:h-4" />
            {day.weekday_label}, {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight">
            {day.headline}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
            {day.theme}
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4 md:space-y-5">
        {sessions.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12 border border-border max-w-lg mx-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm md:text-base">
                Nenhuma sessão publicada para este dia ainda.
              </p>
            </div>
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