import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EventDetails {
  id: string;
  slug: string;
  titulo: string;
  subtitulo?: string;
  descricao_richtext?: string;
  inicio_at: string;
  fim_at?: string;
  timezone: string;
  modalidade: string;
  endereco?: string;
  banner_url?: string;
  youtube_url?: string;
  playlist_url?: string;
  tem_inscricao: boolean;
  inscricao_url?: string;
  featured: boolean;
  status_publicacao: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
}

export const useEventDetails = (slug: string) => {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== useEventDetails EFFECT CALLED with slug:', slug);
    const fetchEvent = async () => {
      if (!slug) {
        console.log('=== NO SLUG PROVIDED, setting loading to false');
        setLoading(false);
        return;
      }

      console.log('=== STARTING FETCH for slug:', slug);
      try {
        setLoading(true);
        setError(null);

        // First get the event
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('slug', slug)
          .eq('status_publicacao', 'published')
          .maybeSingle();

        if (eventError) {
          console.error('Error fetching event:', eventError);
          throw eventError;
        }

        if (!eventData) {
          console.log('No event found with slug:', slug);
          setEvent(null);
          setLoading(false);
          return;
        }

        console.log('Event data found:', eventData);

        // Get the translation
        const { data: translationData, error: translationError } = await supabase
          .from('event_translations')
          .select('*')
          .eq('event_id', eventData.id)
          .eq('idioma', 'pt-BR')
          .maybeSingle();

        if (translationError) {
          console.error('Error fetching translation:', translationError);
        }

        console.log('Translation data:', translationData);

        // Combine event and translation data
        const eventDetails: EventDetails = {
          ...eventData,
          titulo: translationData?.titulo || eventData.slug.replace(/-/g, ' ').toUpperCase(),
          subtitulo: translationData?.subtitulo || '',
          descricao_richtext: translationData?.descricao_richtext || '',
          meta_title: translationData?.meta_title || eventData.slug.replace(/-/g, ' ').toUpperCase(),
          meta_description: translationData?.meta_description || '',
          og_image: translationData?.og_image || eventData.banner_url
        };

        console.log('Final event details:', eventDetails);
        setEvent(eventDetails);
        
      } catch (err: any) {
        console.error('Error in fetchEvent:', err);
        setError(err.message);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  return { event, loading, error };
};

// Hook for listing all events (for compatibility with Eventos page)
export const useEvents = () => {
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Get all published events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('status_publicacao', 'published')
          .order('inicio_at', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          throw eventsError;
        }

        console.log('Events data:', eventsData);

        if (!eventsData) {
          setEvents([]);
          setLoading(false);
          return;
        }

        // Get all translations for these events
        const eventIds = eventsData.map(event => event.id);
        const { data: translationsData, error: translationsError } = await supabase
          .from('event_translations')
          .select('*')
          .in('event_id', eventIds)
          .eq('idioma', 'pt-BR');

        if (translationsError) {
          console.error('Error fetching translations:', translationsError);
        }

        console.log('Translations data:', translationsData);

        // Combine events with their translations
        const eventsWithTranslations = eventsData.map(event => {
          const translation = translationsData?.find(t => t.event_id === event.id);
          
          return {
            ...event,
            titulo: translation?.titulo || event.slug.replace(/-/g, ' ').toUpperCase(),
            subtitulo: translation?.subtitulo || '',
            descricao_richtext: translation?.descricao_richtext || '',
            meta_title: translation?.meta_title || event.slug.replace(/-/g, ' ').toUpperCase(),
            meta_description: translation?.meta_description || '',
            og_image: translation?.og_image || event.banner_url
          };
        });

        console.log('Final events with translations:', eventsWithTranslations);
        setEvents(eventsWithTranslations);
        
      } catch (err: any) {
        console.error('Error in fetchEvents:', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, refetch: () => {} };
};