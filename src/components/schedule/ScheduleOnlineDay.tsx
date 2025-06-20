
import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ScheduleOnlineCard from './ScheduleOnlineCard';

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

interface ScheduleOnlineDayProps {
  date: string;
  schedules: Schedule[];
}

const ScheduleOnlineDay: React.FC<ScheduleOnlineDayProps> = ({ date, schedules }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
        <Calendar className="mr-2" />
        {formatDate(date)}
      </h2>
      
      <div className="grid gap-4">
        {schedules.map(schedule => (
          <ScheduleOnlineCard key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </div>
  );
};

export default ScheduleOnlineDay;
