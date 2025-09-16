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
  // Derived fields for display
  titulo: string;
  subtitulo?: string;
  descricao_richtext?: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching events from database...');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status_publicacao', 'published')
        .order('inicio_at', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      console.log('Raw events data:', data);

      // Transform data with fallback values
      const transformedEvents = data?.map((event: any) => ({
        ...event,
        titulo: event.slug?.replace(/-/g, ' ').toUpperCase() || 'Evento sem título',
        subtitulo: 'Evento do III CIVENI 2025',
        descricao_richtext: '<p>Informações do evento em breve.</p>'
      })) || [];

      console.log('Transformed events:', transformedEvents);
      setEvents(transformedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setEvents([]);
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
      
      console.log('Fetching event with slug:', slug);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .eq('status_publicacao', 'published')
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Query result:', data);

      if (data) {
        const transformedEvent = {
          ...data,
          titulo: data.slug?.replace(/-/g, ' ').toUpperCase() || 'Evento',
          subtitulo: 'Evento do III CIVENI 2025',
          descricao_richtext: '<p>Informações detalhadas do evento em breve.</p>'
        };
        
        console.log('Transformed event:', transformedEvent);
        setEvent(transformedEvent as Event);
      } else {
        console.log('No event found');
        setEvent(null);
      }
    } catch (error: any) {
      console.error('Error fetching event:', error);
      setEvent(null);
      if (error.code !== 'PGRST116') {
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