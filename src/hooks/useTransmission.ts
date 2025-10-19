import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Transmission {
  id: string;
  slug: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  description: Record<string, string>;
  status: 'scheduled' | 'live' | 'ended';
  start_at: string | null;
  end_at: string | null;
  timezone: string;
  youtube_video_id: string | null;
  channel_handle: string;
  badge_label: Record<string, string>;
  banner_from: string;
  banner_to: string;
  faq_url: string | null;
  schedule_url: string | null;
  rooms_url: string | null;
  is_public: boolean;
}

export interface TransmissionRoom {
  id: string;
  name: Record<string, string>;
  meet_url: string;
  is_live: boolean;
  ord: number;
}

export const useTransmission = (slug: string = 'transmissao-ao-vivo') => {
  return useQuery({
    queryKey: ['transmission', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
        .maybeSingle();

      if (error) throw error;
      return data as Transmission | null;
    },
    refetchInterval: (query) => {
      // Refetch based on status
      const data = query.state.data;
      if (!data) return false;
      if (data.status === 'live') return 30000; // 30s when live
      if (data.status === 'scheduled') return 120000; // 2min when scheduled
      return 600000; // 10min when ended
    },
  });
};

export const useTransmissionRooms = (transmissionId?: string) => {
  return useQuery({
    queryKey: ['transmission-rooms', transmissionId],
    queryFn: async () => {
      if (!transmissionId) return [];
      
      const { data, error } = await supabase
        .from('transmission_rooms')
        .select('*')
        .eq('transmission_id', transmissionId)
        .order('ord', { ascending: true });

      if (error) throw error;
      return (data as TransmissionRoom[]) || [];
    },
    enabled: !!transmissionId,
    refetchInterval: 60000, // 1min
  });
};

export const useUpcomingTransmissions = () => {
  return useQuery({
    queryKey: ['transmissions-upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('*')
        .eq('status', 'scheduled')
        .eq('is_public', true)
        .order('start_at', { ascending: true })
        .limit(6);

      if (error) throw error;
      return (data as Transmission[]) || [];
    },
    refetchInterval: 300000, // 5min
  });
};

export const pickLang = (
  obj: Record<string, string> | null | undefined,
  locale: string
): string => {
  if (!obj) return '';
  return obj[locale] || obj['pt'] || obj['en'] || obj['es'] || '';
};

export const formatTimezone = (timezone: string): string => {
  const tzMap: Record<string, string> = {
    'America/New_York': 'Florida (UTC-5)',
    'America/Sao_Paulo': 'Brasília (UTC-3)',
    'America/Fortaleza': 'Fortaleza (UTC-3)',
  };
  return tzMap[timezone] || timezone;
};
