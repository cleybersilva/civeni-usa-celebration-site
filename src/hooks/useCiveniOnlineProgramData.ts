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
    queryKey: ['civeni-program-days', 'online'],
    queryFn: async () => {
      // Check if we're in admin mode by checking the current path
      const isAdminMode = window.location.pathname.includes('/admin');

      let query = supabase
        .from('civeni_program_days')
        .select('*')
        .eq('event_slug', 'iii-civeni-2025-online');

      // Only filter published if not in admin mode
      if (!isAdminMode) {
        query = query.eq('is_published', true);
      }

      query = query.order('sort_order');

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    }
  });

  const { data: sessions } = useQuery({
    queryKey: ['civeni-program-sessions', 'online'],
    queryFn: async () => {
      // Check if we're in admin mode by checking the current path
      const isAdminMode = window.location.pathname.includes('/admin');

      let query = supabase
        .from('civeni_program_sessions')
        .select(`
          *,
          civeni_program_days!inner (
            event_slug
          )
        `)
        .eq('civeni_program_days.event_slug', 'iii-civeni-2025-online');

      // Only filter published if not in admin mode
      if (!isAdminMode) {
        query = query.eq('is_published', true);
      }

      query = query.order('order_in_day');

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!days?.length
  });

  const getSessionsForDay = (dayId: string) => {
    const daySessions = sessions?.filter(session => session.day_id === dayId) || [];
    
    // Deduplicate sessions by day_id + start_at + title
    const uniqueSessions = daySessions.reduce((acc, session) => {
      const key = `${session.day_id}-${session.start_at}-${session.title}`;
      if (!acc.has(key)) {
        acc.set(key, session);
      }
      return acc;
    }, new Map());
    
    return Array.from(uniqueSessions.values());
  };

  return {
    settings,
    days,
    sessions,
    isLoading,
    getSessionsForDay
  };
};