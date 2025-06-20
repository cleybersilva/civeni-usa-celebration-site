
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MapPin, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Schedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  category: string;
  speaker_name?: string;
  location?: string;
  description?: string;
  speaker_photo_url?: string;
}

interface ScheduleCardProps {
  schedule: Schedule;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule }) => {
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
            </div>
            <CardTitle className="text-xl mb-2">{schedule.title}</CardTitle>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {schedule.speaker_name && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{schedule.speaker_name}</span>
                </div>
              )}
              {schedule.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{schedule.location}</span>
                </div>
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
                  {schedule.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {schedule.location}
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

export default ScheduleCard;
