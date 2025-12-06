import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LiveStreamVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const useLiveStreamVideos = () => {
  return useQuery<LiveStreamVideo[]>({
    queryKey: ['live-stream-videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_stream_videos')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};
