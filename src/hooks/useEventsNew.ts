import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EventMedia {
  id: string;
  type: 'image' | 'video_youtube' | 'playlist_youtube' | 'pdf' | 'audio' | 'link_externo' | 'banner' | 'galeria';
  title?: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  position: number;
  is_primary: boolean;
  is_public: boolean;
}

interface EventFlags {
  show_speakers: boolean;
  show_schedule_download: boolean;
  show_share_buttons: boolean;
  allow_comments: boolean;
  public_sync_mode: 'realtime' | 'stale-while-revalidate';
  ui_theme?: any;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  short_description?: string;
  full_description?: string;
  start_at: string;
  end_at?: string;
  timezone: string;
  mode: 'online' | 'presencial' | 'hibrido';
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  map_url?: string;
  is_public: boolean;
  is_featured: boolean;
  is_archived: boolean;
  publish_at?: string;
  unpublish_at?: string;
  has_registration: boolean;
  registration_url?: string;
  registration_cta_label: string;
  official_site_url?: string;
  whatsapp_group_url?: string;
  cover_image_url?: string;
  thumbnail_url?: string;
  youtube_playlist_url?: string;
  youtube_channel_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  canonical_url?: string;
  translations?: any;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  // Related data
  media?: EventMedia[];
  flags?: EventFlags;
}

export const useEventsNew = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching events from new structure...');
      
      const { data, error } = await supabase
        .from('events_new')
        .select(`
          *,
          media:event_media(
            id,
            type,
            title,
            description,
            url,
            thumbnail_url,
            position,
            is_primary,
            is_public
          ),
          flags:event_flags(
            show_speakers,
            show_schedule_download,
            show_share_buttons,
            allow_comments,
            public_sync_mode,
            ui_theme
          )
        `)
        .eq('is_public', true)
        .eq('is_archived', false)
        .order('start_at', { ascending: true });

      if (error) {
        console.error('Error fetching events from new structure:', error);
        throw error;
      }

      console.log('Raw events data from new structure:', data);

      // Transform and enrich data
      const transformedEvents = data?.map((event: any) => ({
        ...event,
        media: event.media?.filter((m: any) => m.is_public)?.sort((a: any, b: any) => a.position - b.position) || [],
        flags: event.flags || {
          show_speakers: true,
          show_schedule_download: true,
          show_share_buttons: true,
          allow_comments: false,
          public_sync_mode: 'stale-while-revalidate'
        }
      })) || [];

      console.log('Transformed events from new structure:', transformedEvents);

      setEvents(transformedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erro ao carregar eventos',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEventsNew hook mounted, fetching events...');
    fetchEvents();
  }, []);

  return { events, loading, refetch: fetchEvents };
};

export const useEventBySlugNew = (slug: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvent = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      
      console.log('useEventBySlugNew - Fetching event with slug:', slug);
      
      const { data, error } = await supabase
        .from('events_new')
        .select(`
          *,
          media:event_media(
            id,
            type,
            title,
            description,
            url,
            thumbnail_url,
            position,
            is_primary,
            is_public
          ),
          flags:event_flags(
            show_speakers,
            show_schedule_download,
            show_share_buttons,
            allow_comments,
            public_sync_mode,
            ui_theme
          )
        `)
        .eq('slug', slug)
        .eq('is_public', true)
        .eq('is_archived', false)
        .single();

      console.log('useEventBySlugNew - Query result:', { data, error });

      if (error) {
        console.error('useEventBySlugNew - Database error:', error);
        if (error.code !== 'PGRST116') { // Don't throw error for "not found"
          throw error;
        }
        setEvent(null);
        return;
      }

      // Transform and enrich data
      if (data) {
        const transformedEvent = {
          ...data,
          media: data.media?.filter((m: any) => m.is_public)?.sort((a: any, b: any) => a.position - b.position) || [],
          flags: data.flags || {
            show_speakers: true,
            show_schedule_download: true,
            show_share_buttons: true,
            allow_comments: false,
            public_sync_mode: 'stale-while-revalidate'
          }
        };
        
        console.log('useEventBySlugNew - Transformed event:', transformedEvent);
        setEvent(transformedEvent as Event);
      } else {
        console.log('useEventBySlugNew - No event found');
        setEvent(null);
      }
    } catch (error: any) {
      console.error('useEventBySlugNew - Error fetching event:', error);
      setEvent(null);
      toast({
        title: 'Erro ao carregar evento',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  return { event, loading, refetch: fetchEvent };
};

// Helper functions for event status and logic
export const getEventStatus = (event: Event) => {
  const now = new Date();
  const startDate = new Date(event.start_at);
  const endDate = event.end_at ? new Date(event.end_at) : startDate;

  if (now < startDate) return 'upcoming';
  if (now >= startDate && now <= endDate) return 'live';
  return 'past';
};

export const canRegister = (event: Event) => {
  const now = new Date();
  const endDate = event.end_at ? new Date(event.end_at) : new Date(event.start_at);
  
  return event.has_registration && 
         event.registration_url && 
         event.is_public && 
         !event.is_archived && 
         now <= endDate;
};

export const isEventVisible = (event: Event) => {
  const now = new Date();
  
  // Check base visibility
  if (!event.is_public || event.is_archived) return false;
  
  // Check publish/unpublish dates
  if (event.publish_at && new Date(event.publish_at) > now) return false;
  if (event.unpublish_at && new Date(event.unpublish_at) <= now) return false;
  
  return true;
};