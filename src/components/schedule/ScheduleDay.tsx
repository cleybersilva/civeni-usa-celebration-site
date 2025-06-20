
import React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ScheduleCard from './ScheduleCard';

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

interface ScheduleDayProps {
  date: string;
  schedules: Schedule[];
}

const ScheduleDay: React.FC<ScheduleDayProps> = ({ date, schedules }) => {
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
          <ScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </div>
  );
};

export default ScheduleDay;
