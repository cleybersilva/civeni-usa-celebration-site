import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCiveniOnlineProgramData = () => {
  const { data: settings } = useQuery({
    queryKey: ['civeni-online-program-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('civeni_program_settings')
        .select('*')
        .eq('id', 2)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: days, isLoading } = useQuery({
    queryKey: ['civeni-online-program-days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('civeni_program_days')
        .select('*')
        .eq('event_slug', 'iii-civeni-2025-online')
        .eq('is_published', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: sessions } = useQuery({
    queryKey: ['civeni-online-program-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('civeni_program_sessions')
        .select(`
          *,
          civeni_program_days!inner (
            event_slug
          )
        `)
        .eq('civeni_program_days.event_slug', 'iii-civeni-2025-online')
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