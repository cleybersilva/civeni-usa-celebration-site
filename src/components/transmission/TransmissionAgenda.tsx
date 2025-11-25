import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Video, ExternalLink, Users } from 'lucide-react';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface Schedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  title: string;
  category: string;
  location?: string;
  speaker_name?: string;
  virtual_link?: string;
  type: 'online' | 'presencial';
}

const TransmissionAgenda = () => {
  const { t } = useTranslation();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['transmission-agenda'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('type', 'online')
        .eq('is_published', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Schedule[];
    },
  });

  const getStatusBadge = (date: string, startTime: string, endTime: string | null) => {
    try {
      const now = new Date();
      const scheduleDate = new Date(`${date}T${startTime}`);
      const scheduleEnd = endTime ? new Date(`${date}T${endTime}`) : addHours(scheduleDate, 2);

      if (isBefore(now, scheduleDate)) {
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t('transmission.badges.scheduled', 'Agendado')}</Badge>;
      } else if (isAfter(now, scheduleDate) && isBefore(now, scheduleEnd)) {
        return (
          <Badge className="bg-red-600 text-white animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            {t('transmission.badges.live', 'Ao vivo')}
          </Badge>
        );
      } else {
        return <Badge variant="secondary">{t('transmission.badges.ended', 'Encerrado')}</Badge>;
      }
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

  const formatTime = (timeString: string) => {
    try {
      return timeString.slice(0, 5);
    } catch {
      return timeString;
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

  if (!schedules || schedules.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">{t('transmission.noUpcoming', 'Agenda em breve')}</h3>
            <p className="text-gray-600">
              {t('transmission.noStreamDesc', 'A programação online será publicada em breve. Fique atento!')}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Group by date
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const date = schedule.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedSchedules).map(([date, dateSchedules]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-civeni-blue" />
            <h3 className="text-2xl font-bold text-gray-900">{formatDate(date)}</h3>
          </div>
          <div className="grid gap-4">
            {dateSchedules.map((schedule) => (
              <Card 
                key={schedule.id} 
                className="group p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:-translate-y-1"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-civeni-blue transition-colors">
                        {schedule.title}
                      </h4>
                      {getStatusBadge(schedule.date, schedule.start_time, schedule.end_time)}
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(schedule.start_time)}
                          {schedule.end_time && ` - ${formatTime(schedule.end_time)}`}
                        </span>
                      </div>
                      
                      {schedule.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{schedule.location}</span>
                        </div>
                      )}
                      
                      {schedule.speaker_name && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{schedule.speaker_name}</span>
                        </div>
                      )}
                    </div>

                    {schedule.category && (
                      <Badge variant="outline" className="w-fit">
                        {schedule.category}
                      </Badge>
                    )}
                  </div>
                  
                  {schedule.virtual_link && (
                    <Button 
                      className="bg-civeni-blue hover:bg-civeni-blue/90 w-full md:w-auto shrink-0" 
                      asChild
                    >
                      <a href={schedule.virtual_link} target="_blank" rel="noopener noreferrer">
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
