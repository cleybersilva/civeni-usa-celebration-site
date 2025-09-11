import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from './useAdminAuth';

export const useAdminEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, sessionToken } = useAdminAuth();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
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
              institution
            )
          )
        `)
        .eq('event_translations.idioma', 'pt-BR')
        .order('created_at', { ascending: false });

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
          ?.filter(Boolean) || []
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
      const { data, error } = await supabase.rpc('admin_upsert_event', {
        event_data: eventData,
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) throw error;

      // If event was created, also create translation
      if (data && eventData.translation && typeof data === 'object' && 'id' in data) {
        const translationData = {
          ...eventData.translation,
          event_id: (data as any).id
        };

        const { error: translationError } = await supabase
          .from('event_translations')
          .insert(translationData);

        if (translationError) {
          console.error('Error creating translation:', translationError);
        }
      }

      toast({
        title: 'Evento criado com sucesso',
        description: `O evento "${eventData.translation?.titulo || eventData.slug}" foi criado.`
      });
      
      await fetchEvents();
      return true;
    } catch (error: any) {
      console.error('Error creating event:', error);
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
      const { data, error } = await supabase.rpc('admin_upsert_event', {
        event_data: { ...eventData, id: eventId },
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) throw error;

      // If translation data is provided, update it
      if (eventData.translation) {
        const { error: translationError } = await supabase
          .from('event_translations')
          .upsert({
            ...eventData.translation,
            event_id: eventId
          }, {
            onConflict: 'event_id,idioma'
          });

        if (translationError) {
          console.error('Error updating translation:', translationError);
        }
      }

      toast({
        title: 'Evento atualizado com sucesso',
        description: 'As alterações foram salvas.'
      });
      
      await fetchEvents();
      return true;
    } catch (error: any) {
      console.error('Error updating event:', error);
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
      const { data, error } = await supabase.rpc('admin_delete_event', {
        event_id: eventId,
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && (data as any).success) {
        toast({
          title: 'Evento deletado com sucesso',
          description: 'O evento foi removido permanentemente.'
        });
        await fetchEvents();
        return true;
      } else {
        throw new Error((data as any)?.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
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
      fetchEvents();
    }
  }, [user]);

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};