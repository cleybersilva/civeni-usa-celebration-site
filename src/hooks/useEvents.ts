import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  slug: string;
  inicio_at: string;
  fim_at?: string;
  timezone: string;
  modalidade: 'online' | 'presencial' | 'hibrido';
  endereco?: string;
  banner_url?: string;
  youtube_url?: string;
  playlist_url?: string;
  tem_inscricao: boolean;
  inscricao_url?: string;
  featured: boolean;
  status_publicacao: string;
  created_at: string;
  updated_at: string;
  // From translations
  titulo?: string;
  subtitulo?: string;
  descricao_richtext?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  // Related data
  speakers?: any[];
  areas?: any[];
  sessions?: any[];
  assets?: any[];
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Get current language from localStorage or default to 'pt-BR'
      const currentLanguage = localStorage.getItem('i18nextLng') || 'pt-BR';
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_translations!inner(
            titulo,
            subtitulo,
            descricao_richtext,
            meta_title,
            meta_description,
            og_image
          ),
          event_speakers(
            ordem,
            cms_speakers(
              id,
              name,
              title,
              institution,
              image_url
            )
          ),
          event_areas(
            thematic_areas(
              id,
              name_pt,
              name_en,
              description_pt,
              description_en
            )
          ),
          event_sessions(
            id,
            inicio_at,
            fim_at,
            titulo,
            descricao,
            speaker_id,
            sala_url,
            ordem
          ),
          event_assets(
            id,
            asset_url,
            caption,
            ordem
          )
        `)
        .eq('status_publicacao', 'published')
        .eq('event_translations.idioma', currentLanguage)
        .order('inicio_at', { ascending: true });

      if (error) throw error;

      // Transform data to flatten translations
      const transformedEvents = data?.map((event: any) => ({
        ...event,
        titulo: event.event_translations[0]?.titulo,
        subtitulo: event.event_translations[0]?.subtitulo,
        descricao_richtext: event.event_translations[0]?.descricao_richtext,
        meta_title: event.event_translations[0]?.meta_title,
        meta_description: event.event_translations[0]?.meta_description,
        og_image: event.event_translations[0]?.og_image,
        speakers: event.event_speakers
          ?.sort((a: any, b: any) => a.ordem - b.ordem)
          ?.map((es: any) => es.cms_speakers)
          ?.filter(Boolean) || [],
        areas: event.event_areas?.map((ea: any) => ea.thematic_areas)?.filter(Boolean) || [],
        sessions: event.event_sessions
          ?.sort((a: any, b: any) => a.ordem - b.ordem) || [],
        assets: event.event_assets
          ?.sort((a: any, b: any) => a.ordem - b.ordem) || []
      })) || [];

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
    fetchEvents();
  }, []);

  return { events, loading, refetch: fetchEvents };
};

export const useEventBySlug = (slug: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvent = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      
      // Get current language from localStorage or default to 'pt-BR'
      const currentLanguage = localStorage.getItem('i18nextLng') || 'pt-BR';
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_translations!inner(
            titulo,
            subtitulo,
            descricao_richtext,
            meta_title,
            meta_description,
            og_image
          ),
          event_speakers(
            ordem,
            cms_speakers(
              id,
              name,
              title,
              institution,
              image_url
            )
          ),
          event_areas(
            thematic_areas(
              id,
              name_pt,
              name_en,
              description_pt,
              description_en
            )
          ),
          event_sessions(
            id,
            inicio_at,
            fim_at,
            titulo,
            descricao,
            speaker_id,
            sala_url,
            ordem
          ),
          event_assets(
            id,
            asset_url,
            caption,
            ordem
          )
        `)
        .eq('slug', slug)
        .eq('status_publicacao', 'published')
        .eq('event_translations.idioma', currentLanguage)
        .single();

      if (error) throw error;

      // Transform data to flatten translations
      if (data) {
        const transformedEvent = {
          ...data,
          titulo: data.event_translations[0]?.titulo,
          subtitulo: data.event_translations[0]?.subtitulo,
          descricao_richtext: data.event_translations[0]?.descricao_richtext,
          meta_title: data.event_translations[0]?.meta_title,
          meta_description: data.event_translations[0]?.meta_description,
          og_image: data.event_translations[0]?.og_image,
          speakers: data.event_speakers
            ?.sort((a: any, b: any) => a.ordem - b.ordem)
            ?.map((es: any) => es.cms_speakers)
            ?.filter(Boolean) || [],
          areas: data.event_areas?.map((ea: any) => ea.thematic_areas)?.filter(Boolean) || [],
          sessions: data.event_sessions
            ?.sort((a: any, b: any) => a.ordem - b.ordem) || [],
          assets: data.event_assets
            ?.sort((a: any, b: any) => a.ordem - b.ordem) || []
        };
        
        setEvent(transformedEvent as Event);
      } else {
        setEvent(null);
      }
    } catch (error: any) {
      console.error('Error fetching event:', error);
      setEvent(null);
      if (error.code !== 'PGRST116') { // Don't show error for "not found"
        toast({
          title: 'Erro ao carregar evento',
          description: error.message,
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  return { event, loading, refetch: fetchEvent };
};