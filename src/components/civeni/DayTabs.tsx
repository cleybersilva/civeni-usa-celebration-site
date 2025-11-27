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
      <TabsList className="grid w-full grid-cols-3 mb-0 h-auto p-0 bg-white rounded-t-2xl shadow-lg border border-border/30 overflow-hidden">
        {days.map((day, index) => {
          const isActive = activeDay === day.id;
          
          return (
            <TabsTrigger 
              key={day.id} 
              value={day.id}
              className={`
                flex flex-col items-center gap-1 py-5 px-4 rounded-none transition-all duration-300 border-0
                ${isActive 
                  ? 'bg-gradient-to-r from-civeni-blue via-civeni-red to-civeni-blue text-white' 
                  : 'bg-transparent hover:bg-slate-50 text-civeni-blue'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isActive ? 'text-white' : 'text-civeni-blue'}`} />
                <span className="font-semibold">
                  {t('schedule.day')} {index + 1}
                </span>
              </div>
              <div className={`text-xs ${isActive ? 'text-white/90' : 'text-muted-foreground'}`}>
                {translateWeekday(day.weekday_label)}, {formatDate(day.date)}
              </div>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};

export default DayTabs;