import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Users } from 'lucide-react';
import { useCurrentStream, useCurrentSession } from '@/hooks/useTransmissionData';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const LivePlayer = () => {
  const { t, i18n } = useTranslation();
  const { data: stream, isLoading: streamLoading } = useCurrentStream();
  const { data: session } = useCurrentSession();

  const getTitle = (titleObj: Record<string, string> | undefined) => {
    if (!titleObj) return '';
    return titleObj[i18n.language] || titleObj.pt || '';
  };

  const getDescription = (descObj: Record<string, string> | undefined) => {
    if (!descObj) return '';
    return descObj[i18n.language] || descObj.pt || '';
  };

  const formatTime = (isoString: string | null, timezone: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    
    // Format for Florida (ET)
    const etTime = date.toLocaleString(i18n.language, {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Format for Brazil (BRT)
    const brtTime = date.toLocaleString(i18n.language, {
      timeZone: 'America/Fortaleza',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return `${etTime} (Florida) / ${brtTime} (Fortaleza)`;
  };

  if (streamLoading) {
    return (
      <div className="aspect-video bg-muted animate-pulse rounded-lg" />
    );
  }

  const videoId = stream?.youtube_video_id;
  const isLive = stream?.status === 'live';
  const isScheduled = stream?.status === 'scheduled';

  return (
    <div className="space-y-4">
      {/* Player */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
        {videoId ? (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=${isLive ? 1 : 0}&cc_load_policy=1`}
            title={getTitle(stream?.title)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center space-y-2">
              <Calendar className="w-12 h-12 mx-auto opacity-50" />
              <p className="text-lg">{t('transmission.noStream')}</p>
            </div>
          </div>
        )}
        
        {/* Live indicator */}
        {isLive && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-600 text-white animate-pulse">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full" />
                {t('transmission.live')}
              </span>
            </Badge>
          </div>
        )}
      </div>

      {/* Stream Info */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {stream ? getTitle(stream.title) : t('transmission.noStreamTitle')}
              </h2>
              {stream && (
                <Badge variant={isLive ? 'destructive' : isScheduled ? 'default' : 'secondary'}>
                  {stream.status === 'live' ? t('transmission.badges.live') : 
                   stream.status === 'scheduled' ? t('transmission.badges.scheduled') : 
                   t('transmission.badges.ended')}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {stream ? getDescription(stream.description) : t('transmission.noStreamDesc')}
            </p>
          </div>
        </div>

        {/* Timing info */}
        {stream && stream.start_at && (
          <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(stream.start_at, stream.timezone)}</span>
            </div>
            {session && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{getTitle(session.title)}</span>
              </div>
            )}
          </div>
        )}

        {/* Channel info */}
        {stream?.channel_handle && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            <span>{t('transmission.channel')}: </span>
            <a 
              href={`https://youtube.com/${stream.channel_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {stream.channel_handle}
            </a>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LivePlayer;
