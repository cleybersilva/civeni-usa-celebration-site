
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScheduleFiltersProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  uniqueDates: string[];
  categories: string[];
  onDownload: () => void;
}

const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
  selectedDate,
  setSelectedDate,
  selectedCategory,
  setSelectedCategory,
  uniqueDates,
  categories,
  onDownload,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="mb-8 px-0">
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedDate === '' ? 'default' : 'outline'}
            onClick={() => setSelectedDate('')}
            size="sm"
          >
            Todas as Datas
          </Button>
          {uniqueDates.map(date => (
            <Button
              key={date}
              variant={selectedDate === date ? 'default' : 'outline'}
              onClick={() => setSelectedDate(date)}
              size="sm"
            >
              {formatDate(date)}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('')}
            size="sm"
          >
            Todas as Categorias
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              size="sm"
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={onDownload} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Cronograma
        </Button>
      </div>
    </div>
  );
};

export default ScheduleFilters;
