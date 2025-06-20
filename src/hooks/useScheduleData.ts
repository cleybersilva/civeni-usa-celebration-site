
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useScheduleData = (type: 'presencial' | 'online') => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('type', type)
        .eq('is_published', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const uniqueDates = [...new Set(schedules?.map(s => s.date))].sort();
  const categories = ['palestra', 'workshop', 'painel', 'intervalo', 'credenciamento'];

  const filteredSchedules = schedules?.filter(schedule => {
    const dateMatch = !selectedDate || schedule.date === selectedDate;
    const categoryMatch = !selectedCategory || schedule.category === selectedCategory;
    return dateMatch && categoryMatch;
  });

  return {
    schedules,
    isLoading,
    selectedDate,
    setSelectedDate,
    selectedCategory,
    setSelectedCategory,
    uniqueDates,
    categories,
    filteredSchedules,
  };
};
