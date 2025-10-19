import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Stream {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  status: 'scheduled' | 'live' | 'ended';
  youtube_video_id: string | null;
  channel_handle: string | null;
  start_at: string | null;
  end_at: string | null;
  timezone: string;
  is_fallback: boolean;
  thumbnail_url: string | null;
}

interface Session {
  id: string;
  day: number;
  track: 'online' | 'presencial';
  type: string;
  title: Record<string, string>;
  speakers: any[];
  location: string | null;
  start_et: string;
  end_et: string;
  timezone: string;
  status: string;
  stream_id: string | null;
  meet_room_id: string | null;
  materials: any[];
}

interface MeetRoom {
  id: string;
  name: string;
  status: 'idle' | 'live' | 'ended';
  moderators: string[];
  capacity: number;
  visibility: string;
  notes: string | null;
}

export const useCurrentStream = () => {
  return useQuery({
    queryKey: ['transmission', 'current-stream'],
    queryFn: async () => {
      // Try to get live stream first
      const { data: live } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'live')
        .eq('visibility', 'public')
        .order('start_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (live) return live as Stream;

      // If no live, get next scheduled
      const { data: scheduled } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'scheduled')
        .eq('visibility', 'public')
        .gt('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (scheduled) return scheduled as Stream;

      // If nothing, get fallback
      const { data: fallback } = await supabase
        .from('streams')
        .select('*')
        .eq('is_fallback', true)
        .order('fallback_priority', { ascending: false })
        .limit(1)
        .maybeSingle();

      return fallback as Stream | null;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useUpcomingStreams = (limit = 5) => {
  return useQuery({
    queryKey: ['transmission', 'upcoming-streams', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('status', 'scheduled')
        .eq('visibility', 'public')
        .gt('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Stream[];
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useSessions = (day?: number, track?: 'online' | 'presencial' | 'all') => {
  return useQuery({
    queryKey: ['transmission', 'sessions', day, track],
    queryFn: async () => {
      let query = supabase
        .from('v_sessions_front')
        .select('*')
        .order('start_et', { ascending: true });

      if (day) {
        query = query.eq('day', day);
      }

      if (track && track !== 'all') {
        query = query.eq('track', track);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Session[];
    },
    refetchInterval: 60000,
  });
};

export const useMeetRooms = () => {
  return useQuery({
    queryKey: ['transmission', 'meet-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_meet_rooms')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as MeetRoom[];
    },
    refetchInterval: 30000,
  });
};

export const useCurrentSession = () => {
  return useQuery({
    queryKey: ['transmission', 'current-session'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('v_sessions_front')
        .select('*')
        .lte('start_et', now)
        .gte('end_et', now)
        .order('start_et', { ascending: true })
        .limit(1)
        .maybeSingle();

      return data as Session | null;
    },
    refetchInterval: 30000,
  });
};
