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
      <TabsList className="grid w-full grid-cols-3 mb-8">
        {days.map((day) => (
          <TabsTrigger 
            key={day.id} 
            value={day.id}
            className="flex flex-col items-center gap-1 py-3"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold">
                {t('schedule.day')} {days.findIndex(d => d.id === day.id) + 1}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {translateWeekday(day.weekday_label)}, {formatDate(day.date)}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default DayTabs;