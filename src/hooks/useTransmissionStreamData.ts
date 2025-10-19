import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface TransmissionStream {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  youtube_video_id: string | null;
  youtube_channel_handle: string;
  is_live: boolean;
  scheduled_date: string | null;
  order_index: number;
  is_active: boolean;
}

interface TransmissionSchedule {
  id: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string | null;
  topic: Record<string, string>;
  speaker: string | null;
  modality: 'online' | 'presencial' | 'hibrido';
  meet_room_link: string | null;
  stream_id: string | null;
  order_index: number;
}

interface TransmissionFAQ {
  id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  order_index: number;
}

export const useCurrentLiveStream = () => {
  return useQuery({
    queryKey: ['transmission-current-live'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmission_streams')
        .select('*')
        .eq('is_active', true)
        .eq('is_live', true)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current live stream:', error);
        throw error;
      }

      return data as TransmissionStream | null;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useUpcomingStreams = (limit: number = 5) => {
  return useQuery({
    queryKey: ['transmission-upcoming', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmission_streams')
        .select('*')
        .eq('is_active', true)
        .eq('is_live', false)
        .not('scheduled_date', 'is', null)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming streams:', error);
        throw error;
      }

      return (data as TransmissionStream[]) || [];
    },
  });
};

export const useFallbackStream = () => {
  return useQuery({
    queryKey: ['transmission-fallback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmission_streams')
        .select('*')
        .eq('is_active', true)
        .not('youtube_video_id', 'is', null)
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching fallback stream:', error);
        throw error;
      }

      return data as TransmissionStream | null;
    },
  });
};

export const useTransmissionSchedule = (day?: number) => {
  return useQuery({
    queryKey: ['transmission-schedule', day],
    queryFn: async () => {
      let query = supabase
        .from('transmission_schedule')
        .select('*')
        .eq('is_active', true);

      if (day) {
        query = query.eq('day', day);
      }

      const { data, error } = await query.order('date', { ascending: true }).order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching transmission schedule:', error);
        throw error;
      }

      return (data as TransmissionSchedule[]) || [];
    },
  });
};

export const useTransmissionFAQ = () => {
  const { i18n } = useTranslation();

  return useQuery({
    queryKey: ['transmission-faq'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmission_faq')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching transmission FAQ:', error);
        throw error;
      }

      return (data as TransmissionFAQ[]) || [];
    },
  });
};
