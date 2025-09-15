import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import SessionCard from './SessionCard';

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
    
    const sessionStart = new Date(session.start_at);
    const sessionEnd = session.end_at ? new Date(session.end_at) : new Date(sessionStart.getTime() + 60 * 60 * 1000);
    
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
      <div className="text-center py-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {day.headline}
        </h2>
        <p className="text-muted-foreground text-lg">
          {day.theme}
        </p>
        <div className="text-sm text-muted-foreground mt-2">
          {day.weekday_label}, {new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma sessão publicada para este dia ainda.
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