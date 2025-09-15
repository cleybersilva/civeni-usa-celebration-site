import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCiveniProgramData = () => {
  const { data: settings } = useQuery({
    queryKey: ['civeni-program-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('civeni_program_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: days, isLoading } = useQuery({
    queryKey: ['civeni-program-days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('civeni_program_days')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: sessions } = useQuery({
    queryKey: ['civeni-program-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('civeni_program_sessions')
        .select('*')
        .eq('is_published', true)
        .order('order_in_day');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!days?.length
  });

  const getSessionsForDay = (dayId: string) => {
    return sessions?.filter(session => session.day_id === dayId) || [];
  };

  return {
    settings,
    days,
    sessions,
    isLoading,
    getSessionsForDay
  };
};