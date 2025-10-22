import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from './useAdminAuth';

interface AdminEvent {
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
  event_translations?: any[];
}

export const useAdminEvents = () => {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user, sessionToken } = useAdminAuth();

  console.log('=== useAdminEvents: Hook initialized ===');

  const fetchEvents = async () => {
    console.log('=== fetchEvents: Starting ===');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      setLoading(true);
      setError(null);
      
      // Set admin context
      if (user && sessionToken) {
        console.log('=== Setting admin context ===');
        await supabase.rpc('set_current_user_email_secure', {
          user_email: user.email,
          session_token: sessionToken
        });
      }
      
      // Fetch ALL events with translations and speakers - same structure as useEvents
      console.log('=== Fetching events with translations ===');
      const { data, error: fetchError } = await supabase
        .from('events')
        .select(`
          id,
          slug,
          inicio_at,
          fim_at,
          timezone,
          modalidade,
          endereco,
          banner_url,
          youtube_url,
          playlist_url,
          tem_inscricao,
          inscricao_url,
          featured,
          status_publicacao,
          created_at,
          updated_at,
          event_translations(
            titulo,
            subtitulo,
            descricao_richtext,
            meta_title,
            meta_description,
            og_image,
            idioma
          ),
          event_speakers(
            ordem,
            cms_speakers(
              id,
              name,
              title,
              institution
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('=== Error fetching events ===', fetchError);
        throw fetchError;
      }

      console.log('=== Events fetched successfully ===', data?.length || 0, 'events');

      // Transform data - flatten translations for PT-BR
      const transformedEvents = data?.map((event: any) => {
        const ptTranslation = event.event_translations?.find((t: any) => t.idioma === 'pt-BR');
        
        return {
          ...event,
          titulo: ptTranslation?.titulo || event.slug.replace(/-/g, ' ').toUpperCase(),
          subtitulo: ptTranslation?.subtitulo || '',
          descricao_richtext: ptTranslation?.descricao_richtext || '',
          meta_title: ptTranslation?.meta_title || event.slug.replace(/-/g, ' ').toUpperCase(),
          meta_description: ptTranslation?.meta_description || '',
          og_image: ptTranslation?.og_image || event.banner_url,
          speakers: event.event_speakers
            ?.sort((a: any, b: any) => a.ordem - b.ordem)
            ?.map((es: any) => es.cms_speakers)
            ?.filter(Boolean) || []
        };
      }) || [];

      console.log('=== Transformed events ===', transformedEvents.length, 'events ready');
      setEvents(transformedEvents);
      
    } catch (error: any) {
      console.error('=== ERRO AO CARREGAR EVENTOS ===', error);
      
      const errorMessage = error.name === 'AbortError' 
        ? 'Tempo limite excedido ao carregar eventos'
        : error.message || 'Erro ao carregar eventos';
      
      setError(new Error(errorMessage));
      setEvents([]);
      
      toast({
        title: 'Erro ao carregar eventos',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log('=== fetchEvents: Completed ===');
    }
  };

  const createEvent = async (eventData: any) => {
    if (!user || !sessionToken) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado como administrador',
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log('=== Creating event ===', eventData);
      
      // Use RPC function to create event
      const { data, error } = await supabase.rpc('admin_upsert_event', {
        event_data: eventData,
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) throw error;

      console.log('=== Event created ===', data);

      // Get event ID
      const eventId = typeof data === 'object' && data && 'id' in data ? (data as any).id : null;

      // Create PT-BR translation if provided
      if (eventData.translation && eventId) {
        const { error: translationError } = await supabase
          .from('event_translations')
          .upsert({
            ...eventData.translation,
            event_id: eventId,
            idioma: 'pt-BR'
          }, {
            onConflict: 'event_id,idioma'
          });

        if (translationError) {
          console.error('Translation error:', translationError);
        }
      }

      toast({
        title: 'Evento criado',
        description: 'O evento foi criado com sucesso'
      });
      
      await fetchEvents();
      return true;
    } catch (error: any) {
      console.error('=== Error creating event ===', error);
      toast({
        title: 'Erro ao criar evento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateEvent = async (eventId: string, eventData: any) => {
    if (!user || !sessionToken) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado como administrador',
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log('=== Updating event ===', eventId, eventData);
      
      const { data, error } = await supabase.rpc('admin_upsert_event', {
        event_data: { ...eventData, id: eventId },
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) throw error;

      // Update PT-BR translation if provided
      if (eventData.translation) {
        const { error: translationError } = await supabase
          .from('event_translations')
          .upsert({
            ...eventData.translation,
            event_id: eventId,
            idioma: 'pt-BR'
          }, {
            onConflict: 'event_id,idioma'
          });

        if (translationError) {
          console.error('Translation error:', translationError);
        }
      }

      toast({
        title: 'Evento atualizado',
        description: 'As alterações foram salvas'
      });
      
      await fetchEvents();
      return true;
    } catch (error: any) {
      console.error('=== Error updating event ===', error);
      toast({
        title: 'Erro ao atualizar evento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user || !sessionToken) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado como administrador',
        variant: 'destructive'
      });
      return false;
    }

    try {
      console.log('=== Deleting event ===', eventId);
      
      const { data, error } = await supabase.rpc('admin_delete_event', {
        event_id: eventId,
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) throw error;

      toast({
        title: 'Evento deletado',
        description: 'O evento foi removido'
      });
      
      await fetchEvents();
      return true;
    } catch (error: any) {
      console.error('=== Error deleting event ===', error);
      toast({
        title: 'Erro ao deletar evento',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      console.log('=== useAdminEvents: Fetching on user change ===');
      fetchEvents();
    }
  }, [user]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};