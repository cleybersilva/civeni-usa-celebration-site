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
      
      console.log('Fetching events for public site with language:', currentLanguage);
      
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
            og_image,
            idioma
          )
        `)
        .eq('status_publicacao', 'published')
        .order('inicio_at', { ascending: true });

      if (error) {
        console.error('Error fetching events for public site:', error);
        throw error;
      }

      console.log('Raw events data from database:', data);

      // Transform data to flatten translations and filter by language
      const transformedEvents = data?.map((event: any) => {
        const translation = event.event_translations?.find((t: any) => t.idioma === currentLanguage);
        
        // If no translation exists, use the event slug as title
        return {
          ...event,
          titulo: translation?.titulo || event.slug.replace(/-/g, ' ').toUpperCase(),
          subtitulo: translation?.subtitulo || '',
          descricao_richtext: translation?.descricao_richtext || '',
          meta_title: translation?.meta_title || event.slug.replace(/-/g, ' ').toUpperCase(),
          meta_description: translation?.meta_description || '',
          og_image: translation?.og_image || event.banner_url,
          speakers: [],
          areas: [],
          sessions: [],
          assets: []
        };
      }) || [];

      console.log('Transformed events for public site:', transformedEvents);

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
    console.log('useEvents hook mounted, fetching events...');
    fetchEvents();
    
    // Log when events change
    if (events && events.length > 0) {
      console.log('Events loaded in useEffect:', events);
    }
  }, []);

  // Add another useEffect to log whenever events state changes
  useEffect(() => {
    console.log('useEvents - events state changed:', events);
  }, [events]);

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
            og_image,
            idioma
          )
        `)
        .eq('slug', slug)
        .eq('status_publicacao', 'published')
        .single();

      if (error) throw error;

      // Transform data to flatten translations
      if (data) {
        // Find translation for current language or use fallback
        const translation = data.event_translations?.find((t: any) => t.idioma === currentLanguage);
        
        const transformedEvent = {
          ...data,
          titulo: translation?.titulo || data.slug.replace(/-/g, ' ').toUpperCase(),
          subtitulo: translation?.subtitulo || '',
          descricao_richtext: translation?.descricao_richtext || '',
          meta_title: translation?.meta_title || data.slug.replace(/-/g, ' ').toUpperCase(),
          meta_description: translation?.meta_description || '',
          og_image: translation?.og_image || data.banner_url,
          speakers: [],
          areas: [],
          sessions: [],
          assets: []
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