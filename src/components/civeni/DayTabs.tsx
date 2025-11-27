import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';

interface Day {
  id: string;
  date: string;
  weekday_label: string;
  headline: string;
  theme: string;
}

interface DayTabsProps {
  days: Day[];
  activeDay: string;
  onDayChange: (dayId: string) => void;
}

const DayTabs: React.FC<DayTabsProps> = ({ days, activeDay, onDayChange }) => {
  const { t, i18n } = useTranslation();
  
  const getLocale = () => {
    const lang = i18n.language;
    if (lang === 'pt') return 'pt-BR';
    if (lang === 'es') return 'es-ES';
    if (lang === 'tr') return 'tr-TR';
    return 'en-US';
  };

  const translateWeekday = (weekdayLabel: string) => {
    const weekdayMap: Record<string, string> = {
      'Segunda-feira': t('schedule.weekdays.monday'),
      'Terça-feira': t('schedule.weekdays.tuesday'),
      'Quarta-feira': t('schedule.weekdays.wednesday'),
      'Quinta-feira': t('schedule.weekdays.thursday'),
      'Sexta-feira': t('schedule.weekdays.friday'),
      'Sábado': t('schedule.weekdays.saturday'),
      'Domingo': t('schedule.weekdays.sunday'),
    };
    return weekdayMap[weekdayLabel] || weekdayLabel;
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit' });
  };

  return (
    <Tabs value={activeDay} onValueChange={onDayChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-auto p-0 bg-transparent rounded-none shadow-none overflow-hidden border-0">
        {days.map((day, index) => (
            <TabsTrigger 
              key={day.id} 
              value={day.id}
              className="flex flex-col items-center gap-1 py-4 sm:py-5 px-2 sm:px-4 rounded-none transition-all duration-300 border-0 min-w-0 text-white data-[state=active]:brightness-110 hover:brightness-105"
              style={{
                background: 'linear-gradient(90deg, #021b3a 0%, #c51d3b 50%, #021b3a 100%)'
              }}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="font-bold text-sm sm:text-lg text-white">
                  {t('schedule.day')} {index + 1}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-white/90 truncate max-w-full">
                {translateWeekday(day.weekday_label)}, {formatDate(day.date)}
              </div>
            </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default DayTabs;