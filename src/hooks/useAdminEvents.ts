import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from './useAdminAuth';

export const useAdminEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, sessionToken } = useAdminAuth();

  console.log('=== useAdminEvents: Hook initialized ===');
  console.log('User:', user?.email, 'Has session token:', !!sessionToken);

  const fetchEvents = async () => {
    console.log('=== fetchEvents: Starting ===');
    try {
      setLoading(true);
      
      // Set admin context before querying
      if (user && sessionToken) {
        console.log('=== Setting admin context ===');
        const { error: contextError } = await supabase.rpc('set_current_user_email_secure', {
          user_email: user.email,
          session_token: sessionToken
        });
        
        if (contextError) {
          console.error('Error setting admin context:', contextError);
        } else {
          console.log('=== Admin context set successfully ===');
        }
      }
      
      // First, fetch all events
      console.log('=== Fetching events from database ===');
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('=== Error fetching events ===', eventsError);
        throw eventsError;
      }

      console.log('=== Events fetched successfully ===', eventsData?.length || 0, 'events');

      if (!eventsData || eventsData.length === 0) {
        console.log('No events found');
        setEvents([]);
        setLoading(false);
        return;
      }

      // Then fetch translations for these events
      const eventIds = eventsData.map(e => e.id);
      console.log('=== Fetching translations for', eventIds.length, 'events ===');
      
      const { data: translationsData, error: translationsError } = await supabase
        .from('event_translations')
        .select('*')
        .in('event_id', eventIds);

      if (translationsError) {
        console.error('Error fetching translations:', translationsError);
      } else {
        console.log('=== Translations fetched ===', translationsData?.length || 0, 'translations');
      }

      // Fetch speakers for these events
      console.log('=== Fetching speakers ===');
      const { data: speakersData, error: speakersError } = await supabase
        .from('event_speakers')
        .select(`
          *,
          cms_speakers(
            id,
            name,
            title,
            institution
          )
        `)
        .in('event_id', eventIds)
        .order('ordem', { ascending: true });

      if (speakersError) {
        console.error('Error fetching speakers:', speakersError);
      } else {
        console.log('=== Speakers fetched ===', speakersData?.length || 0, 'speaker relations');
      }

      // Combine the data
      console.log('=== Combining data ===');
      const data = eventsData.map(event => ({
        ...event,
        event_translations: translationsData?.filter(t => t.event_id === event.id) || [],
        event_speakers: speakersData?.filter(s => s.event_id === event.id) || []
      }));

      console.log('Admin events fetched:', data);

      // Ensure all events have Portuguese translations
      if (data && user) {
        for (const event of data) {
          const ptTranslation = event.event_translations?.find((t: any) => t.idioma === 'pt-BR');
          
          if (!ptTranslation) {
            console.log(`Creating missing translation for event: ${event.slug}`);
            
            // Create default translation
            const defaultTitle = event.slug.replace(/-/g, ' ').toUpperCase();
            const { error: translationError } = await supabase
              .from('event_translations')
              .insert({
                event_id: event.id,
                idioma: 'pt-BR',
                titulo: defaultTitle,
                subtitulo: 'Evento do III CIVENI 2025',
                descricao_richtext: `Participe do ${defaultTitle}, um evento importante do III CIVENI 2025.`,
                meta_title: defaultTitle,
                meta_description: `Participe do ${defaultTitle} - III CIVENI 2025`
              });

            if (translationError) {
              console.error('Error creating translation:', translationError);
            } else {
              console.log(`Translation created for: ${defaultTitle}`);
              // Refetch to get the complete translation data
            }
          }
        }
      }

      // Transform data to flatten translations
      const transformedEvents = data?.map((event: any) => {
        const ptTranslation = event.event_translations?.find((t: any) => t.idioma === 'pt-BR');
        return {
          ...event,
          titulo: ptTranslation?.titulo || event.slug,
          subtitulo: ptTranslation?.subtitulo,
          descricao_richtext: ptTranslation?.descricao_richtext,
          meta_title: ptTranslation?.meta_title,
          meta_description: ptTranslation?.meta_description,
          og_image: ptTranslation?.og_image,
          speakers: event.event_speakers
            ?.sort((a: any, b: any) => a.ordem - b.ordem)
            ?.map((es: any) => es.cms_speakers)
            ?.filter(Boolean) || []
        };
      }) || [];

      console.log('Transformed admin events:', transformedEvents);
      console.log('=== Setting events state with', transformedEvents.length, 'events ===');

      setEvents(transformedEvents);
    } catch (error: any) {
      console.error('=== ERRO AO CARREGAR EVENTOS ===', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: 'Erro ao carregar eventos',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      console.log('=== fetchEvents: Completed, loading set to false ===');
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
      console.log('Creating event with data:', eventData);
      
      // Create the event first
      const { data, error } = await supabase.rpc('admin_upsert_event', {
        event_data: eventData,
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) {
        console.error('Error from admin_upsert_event:', error);
        throw error;
      }

      console.log('Event created successfully:', data);

      let eventId = null;
      if (typeof data === 'object' && data && 'id' in data) {
        eventId = (data as any).id;
      }

      // Create translation if provided and we have an event ID
      if (eventData.translation && eventId) {
        const translationData = {
          ...eventData.translation,
          event_id: eventId
        };

        console.log('Creating translation with data:', translationData);

        const { error: translationError } = await supabase
          .from('event_translations')
          .upsert(translationData, {
            onConflict: 'event_id,idioma'
          });

        if (translationError) {
          console.error('Error creating translation:', translationError);
          // Don't fail the entire operation, just log the error
          toast({
            title: 'Aviso',
            description: 'Evento criado mas houve problema na tradução. Edite o evento para corrigir.',
            variant: 'default'
          });
        } else {
          console.log('Translation created successfully');
        }
      }

      toast({
        title: 'Evento criado com sucesso',
        description: `O evento "${eventData.translation?.titulo || eventData.slug}" foi criado e está disponível no site.`
      });
      
      // Refresh events list
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