import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Video, ExternalLink, Users } from 'lucide-react';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useCiveniOnlineProgramData } from '@/hooks/useCiveniOnlineProgramData';

interface TransmissionDay {
  id: string;
  date: string;
}

interface TransmissionSession {
  id: string;
  start_at: string;
  end_at: string | null;
  title: string;
  session_type: string;
  room?: string | null;
  modality?: string | null;
  livestream_url?: string | null;
}

const TransmissionAgenda = () => {
  const { t } = useTranslation();
  const { days, getSessionsForDay, isLoading } = useCiveniOnlineProgramData();

  const transmissionDays = (days || [])
    .map((day) => {
      const sessions = (getSessionsForDay(day.id) as TransmissionSession[]).filter(
        (session) => !!session.livestream_url
      );
      return { day: day as TransmissionDay, sessions };
    })
    .filter((group) => group.sessions.length > 0);

  const getStatusBadge = (startAt: string, endAt: string | null) => {
    try {
      const now = new Date();
      const scheduleStart = new Date(startAt);
      const scheduleEnd = endAt ? new Date(endAt) : addHours(scheduleStart, 2);

      if (isBefore(now, scheduleStart)) {
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t('transmission.badges.scheduled', 'Agendado')}
          </Badge>
        );
      }

      if (isAfter(now, scheduleStart) && isBefore(now, scheduleEnd)) {
        return (
          <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            {t('transmission.badges.live', 'Ao vivo')}
          </Badge>
        );
      }

      return <Badge variant="secondary">{t('transmission.badges.ended', 'Encerrado')}</Badge>;
    } catch (error) {
      return <Badge variant="outline">{t('transmission.badges.scheduled', 'Agendado')}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      if (!isNaN(date.getTime())) {
        return format(date, 'HH:mm');
      }
      return dateTimeString.slice(0, 5);
    } catch {
      return dateTimeString;
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!transmissionDays.length) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">
              {t('transmission.noUpcoming', 'Agenda em breve')}
            </h3>
            <p className="text-gray-600">
              {t(
                'transmission.noStreamDesc',
                'As transmissões online do III CIVENI 2025 acontecerão nos dias 11, 12 e 13 de dezembro, conforme a Programação Presencial e a Programação Online.'
              )}
            </p>
            <p className="text-gray-500 text-sm">
              Até lá, você pode consultar todos os detalhes nas páginas de programação presencial e online.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Render sessions grouped by day
  return (
    <div className="space-y-8">
      {transmissionDays.map(({ day, sessions }) => (
        <div key={day.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-civeni-blue" />
            <h3 className="text-2xl font-bold text-gray-900">{formatDate(day.date)}</h3>
          </div>
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="group p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:-translate-y-1"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-civeni-blue transition-colors">
                        {session.title}
                      </h4>
                      {session.start_at && getStatusBadge(session.start_at, session.end_at || null)}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {session.start_at && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(session.start_at)}
                            {session.end_at && ` - ${formatTime(session.end_at)}`}
                          </span>
                        </div>
                      )}

                      {session.room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{session.room}</span>
                        </div>
                      )}
                    </div>

                    {session.session_type && (
                      <Badge variant="outline" className="w-fit">
                        {session.session_type}
                      </Badge>
                    )}
                  </div>

                  {session.livestream_url && (
                    <Button
                      className="bg-civeni-blue hover:bg-civeni-blue/90 w-full md:w-auto shrink-0"
                      asChild
                    >
                      <a href={session.livestream_url} target="_blank" rel="noopener noreferrer">
                        <Video className="w-4 h-4 mr-2" />
                        {t('transmission.watchLive', 'Acessar transmissão')}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransmissionAgenda;
