
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Globe, Info, Play, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  category: string;
  speaker_name?: string;
  platform?: string;
  description?: string;
  speaker_photo_url?: string;
  virtual_link?: string;
  is_recorded?: boolean;
  recording_url?: string;
  date: string;
}

interface ScheduleOnlineCardProps {
  schedule: Schedule;
}

const ScheduleOnlineCard: React.FC<ScheduleOnlineCardProps> = ({ schedule }) => {
  const { t } = useTranslation();

  const getCategoryColor = (category: string) => {
    const colors = {
      palestra: 'bg-blue-500',
      workshop: 'bg-green-500',
      painel: 'bg-purple-500',
      intervalo: 'bg-orange-500',
      credenciamento: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const isLive = (date: string, startTime: string, endTime: string) => {
    const now = new Date();
    const scheduleDate = new Date(date + 'T' + startTime);
    const endDate = new Date(date + 'T' + endTime);
    return now >= scheduleDate && now <= endDate;
  };

  const isPast = (date: string, endTime: string) => {
    const now = new Date();
    const endDate = new Date(date + 'T' + endTime);
    return now > endDate;
  };

  const live = isLive(schedule.date, schedule.start_time, schedule.end_time);
  const past = isPast(schedule.date, schedule.end_time);

  return (
    <Card className={`hover:shadow-lg transition-shadow ${live ? 'border-red-500 border-2' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-blue-600">
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </span>
              <Badge className={`${getCategoryColor(schedule.category)} text-white`}>
                {schedule.category}
              </Badge>
              {live && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  {t('schedule.live')}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl mb-2">{schedule.title}</CardTitle>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              {schedule.speaker_name && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{schedule.speaker_name}</span>
                </div>
              )}
              {schedule.platform && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>{schedule.platform}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {schedule.virtual_link && (
                <Button
                  asChild
                  variant={live ? 'default' : 'outline'}
                  size="sm"
                  className={live ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <a href={schedule.virtual_link} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-1" />
                    {live ? t('schedule.watchNow') : t('schedule.accessRoom')}
                  </a>
                </Button>
              )}
              
              {past && schedule.is_recorded && schedule.recording_url && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                >
                  <a href={schedule.recording_url} target="_blank" rel="noopener noreferrer">
                    <Video className="w-4 h-4 mr-1" />
                    {t('schedule.viewRecording')}
                  </a>
                </Button>
              )}
            </div>
          </div>
          
          {schedule.speaker_photo_url && (
            <img
              src={schedule.speaker_photo_url}
              alt={schedule.speaker_name}
              className="w-12 h-12 rounded-full object-cover ml-4"
            />
          )}
        </div>
      </CardHeader>
      
      {schedule.description && (
        <CardContent className="pt-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="w-4 h-4 mr-1" />
                {t('schedule.moreInfo')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{schedule.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                  </div>
                  {schedule.speaker_name && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {schedule.speaker_name}
                    </div>
                  )}
                  {schedule.platform && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {schedule.platform}
                    </div>
                  )}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {schedule.description}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      )}
    </Card>
  );
};

export default ScheduleOnlineCard;
