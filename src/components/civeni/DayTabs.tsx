import React from 'react';
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Tabs value={activeDay} onValueChange={onDayChange} className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-3 mb-10 md:mb-12 bg-transparent p-0 h-auto">
        {days.map((day) => (
          <TabsTrigger 
            key={day.id} 
            value={day.id}
            className="flex flex-col items-center gap-2 py-4 md:py-6 px-4 rounded-xl border-2 border-border bg-card hover:bg-accent/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-background/10">
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-bold text-sm md:text-base">
                Dia {days.findIndex(d => d.id === day.id) + 1}
              </span>
            </div>
            <div className="text-xs md:text-sm opacity-90 font-medium">
              {day.weekday_label}
            </div>
            <div className="text-xs opacity-75">
              {formatDate(day.date)}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default DayTabs;