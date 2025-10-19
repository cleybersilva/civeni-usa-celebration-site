import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, Video } from 'lucide-react';

interface Session {
  id: string;
  day: number;
  track: 'online' | 'presencial';
  type: string;
  title: Record<string, string>;
  speakers: any[];
  location: string | null;
  start_et: string;
  end_et: string;
  status: string;
  stream_id: string | null;
  meet_room_id: string | null;
}

interface SessionCardProps {
  session: Session;
}

const SessionCard = ({ session }: SessionCardProps) => {
  const { t, i18n } = useTranslation();

  const getTitle = (titleObj: Record<string, string>) => {
    return titleObj[i18n.language] || titleObj.pt || '';
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    
    const etTime = date.toLocaleString(i18n.language, {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const brtTime = date.toLocaleString(i18n.language, {
      timeZone: 'America/Fortaleza',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return { et: etTime, brt: brtTime };
  };

  const startTime = formatTime(session.start_et);
  const endTime = formatTime(session.end_et);
  
  const isLive = session.status === 'live';
  const hasStream = session.stream_id !== null;
  const hasMeetRoom = session.meet_room_id !== null;

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      abertura: t('transmission.types.opening'),
      conferencia: t('transmission.types.conference'),
      palestra: t('transmission.types.lecture'),
      mesa_redonda: t('transmission.types.roundtable'),
      apresentacao_oral: t('transmission.types.oral'),
      intervalo: t('transmission.types.break'),
      credenciamento: t('transmission.types.registration'),
      outros: t('transmission.types.other'),
    };
    return typeMap[type] || type;
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${isLive ? 'border-red-500 border-2' : ''}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isLive ? 'destructive' : 'secondary'}>
                {isLive ? t('transmission.badges.live') : getTypeLabel(session.type)}
              </Badge>
              <Badge variant="outline">
                {session.track === 'online' ? t('transmission.online') : t('transmission.inPerson')}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg leading-tight">
              {getTitle(session.title)}
            </h3>
          </div>
        </div>

        {/* Time and Location */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
              <span className="font-medium">{startTime.et} - {endTime.et}</span>
              <span className="hidden sm:inline">(Florida)</span>
              <span className="text-xs">/ {startTime.brt} - {endTime.brt} (Fortaleza)</span>
            </div>
          </div>
          
          {session.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{session.location}</span>
            </div>
          )}

          {session.speakers && session.speakers.length > 0 && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                {session.speakers.map((speaker: any, idx: number) => (
                  <span key={idx} className="text-sm">
                    {speaker.name}{speaker.role ? ` - ${speaker.role}` : ''}
                    {speaker.affiliation ? ` (${speaker.affiliation})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {(hasStream || hasMeetRoom) && (
          <div className="pt-2 border-t">
            {hasStream && (
              <Button size="sm" variant="default" className="w-full sm:w-auto">
                <Video className="w-4 h-4 mr-2" />
                {t('transmission.watchLive')}
              </Button>
            )}
            {hasMeetRoom && (
              <Button size="sm" variant="outline" className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2">
                {t('transmission.joinRoom')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SessionCard;
