import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Youtube } from 'lucide-react';
import { useCurrentLiveStream, useFallbackStream } from '@/hooks/useTransmissionStreamData';

const DynamicLivePlayer = () => {
  const { t, i18n } = useTranslation();
  const { data: liveStream, isLoading: liveLoading } = useCurrentLiveStream();
  const { data: fallbackStream, isLoading: fallbackLoading } = useFallbackStream();

  const getTitle = (titleObj: Record<string, string> | undefined) => {
    if (!titleObj) return '';
    return titleObj[i18n.language] || titleObj.pt || '';
  };

  const getDescription = (descObj: Record<string, string> | undefined) => {
    if (!descObj) return '';
    return descObj[i18n.language] || descObj.pt || '';
  };

  const isLoading = liveLoading || fallbackLoading;
  const currentStream = liveStream || fallbackStream;

  if (isLoading) {
    return (
      <Card className="w-full aspect-video bg-muted animate-pulse flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </Card>
    );
  }

  if (!currentStream || !currentStream.youtube_video_id) {
    return (
      <Card className="w-full aspect-video bg-gradient-to-br from-civeni-blue to-civeni-red flex items-center justify-center text-white">
        <div className="text-center space-y-4 p-8">
          <Youtube className="w-16 h-16 mx-auto opacity-50" />
          <h3 className="text-2xl font-bold">{t('transmission.noStream')}</h3>
          <p className="text-lg opacity-90">{t('transmission.noStreamDesc')}</p>
          <Badge variant="secondary" className="mt-4">
            {t('transmission.channel')}: @CiveniUSA2025
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-2xl">
        {liveStream && (
          <Badge className="absolute top-4 left-4 z-10 bg-red-600 text-white animate-pulse">
            🔴 {t('transmission.live')}
          </Badge>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${currentStream.youtube_video_id}?autoplay=1&rel=0`}
          title="CIVENI 2025 Live Stream"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <Card className="p-6 space-y-3 bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {getTitle(currentStream.title)}
          </h3>
          {!liveStream && (
            <Badge variant="outline" className="text-xs">
              {t('transmission.waitingToStart')}
            </Badge>
          )}
        </div>

        {currentStream.description && (
          <p className="text-gray-700 leading-relaxed">
            {getDescription(currentStream.description)}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Youtube className="w-4 h-4" />
          <span>{currentStream.youtube_channel_handle}</span>
        </div>
      </Card>
    </div>
  );
};

export default DynamicLivePlayer;
