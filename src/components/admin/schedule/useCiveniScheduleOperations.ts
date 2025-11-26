import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export type EventType = 'presencial' | 'online';

export type CiveniDay = Database['public']['Tables']['civeni_program_days']['Row'];
export type CiveniDayInsert = Database['public']['Tables']['civeni_program_days']['Insert'];
export type CiveniDayUpdate = Database['public']['Tables']['civeni_program_days']['Update'];

export type CiveniSession = Database['public']['Tables']['civeni_program_sessions']['Row'];
export type CiveniSessionInsert = Database['public']['Tables']['civeni_program_sessions']['Insert'];
export type CiveniSessionUpdate = Database['public']['Tables']['civeni_program_sessions']['Update'];

export type CiveniModality = Database['public']['Enums']['civeni_modality'];
export type CiveniSessionType = Database['public']['Enums']['civeni_session_type'];

const getEventSlug = (type: EventType) => {
  return type === 'presencial' ? 'iii-civeni-2025' : 'iii-civeni-2025-online';
};

export const useCiveniScheduleOperations = () => {
  const queryClient = useQueryClient();
  const { user, sessionToken } = useAdminAuth();

  // Fetch days (admin sees all, published or not)
  const useDays = (type: EventType) => {
    return useQuery({
      queryKey: ['civeni-program-days', type],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('civeni_program_days')
          .select('*')
          .eq('event_slug', getEventSlug(type))
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        return data || [];
      }
    });
  };

  // Fetch sessions
  const useSessions = (type: EventType) => {
    return useQuery({
      queryKey: ['civeni-program-sessions', type],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('civeni_program_sessions')
          .select(`
            *,
            civeni_program_days!inner (
              event_slug
            )
          `)
          .eq('civeni_program_days.event_slug', getEventSlug(type))
          .order('order_in_day');
        
        if (error) throw error;
        return data || [];
      }
    });
  };

  // Create/Update Day
  const dayUpsertMutation = useMutation({
    mutationFn: async ({ formData, editingDay, type }: { 
      formData: any; 
      editingDay: CiveniDay | null;
      type: EventType;
    }) => {
      console.log('dayUpsertMutation executando com:', { formData, editingDay, type });
      
      // Normalizar dados antes de enviar
      const dayData: any = {
        date: formData.date,
        weekday_label: formData.weekday_label,
        headline: formData.headline,
        theme: formData.theme,
        location: formData.location || null,
        modality: formData.modality,
        sort_order: typeof formData.sort_order === 'number' ? formData.sort_order : 0,
        is_published: formData.is_published || false,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        slug: formData.slug || null,
        event_slug: getEventSlug(type),
      };

      if (editingDay?.id) {
        console.log('🟢 Atualizando dia existente, ID:', editingDay.id);
        console.log('🟢 Dados a serem atualizados:', dayData);
        
        const { data, error } = await supabase
          .from('civeni_program_days')
          .update({
            ...dayData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDay.id)
          .select()
          .single();
        
        if (error) {
          console.error('🔴 Erro ao atualizar dia:', error);
          throw error;
        }
        console.log('🟢 Dia atualizado com sucesso:', data);
        return data;
      } else {
        console.log('Nenhum editingDay.id fornecido, buscando dia por data e event_slug');
        const { data: existingDay, error: findError } = await supabase
          .from('civeni_program_days')
          .select('id')
          .eq('event_slug', getEventSlug(type))
          .eq('date', formData.date)
          .maybeSingle();

        if (findError) {
          console.error('Erro ao buscar dia existente por data:', findError);
          throw findError;
        }

        if (existingDay?.id) {
          console.log('🟡 Atualizando dia encontrado por data, ID:', existingDay.id);
          const { data, error } = await supabase
            .from('civeni_program_days')
            .update({
              ...dayData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDay.id)
            .select()
            .single();

          if (error) {
            console.error('Erro ao atualizar dia encontrado por data:', error);
            throw error;
          }

          console.log('Dia atualizado com sucesso (fallback por data):', data);
          return data;
        }

        console.log('Criando novo dia');
        const { data, error } = await supabase
          .from('civeni_program_days')
          .insert(dayData)
          .select()
          .single();
        
        if (error) {
          console.error('Erro ao criar dia:', error);
          throw error;
        }
        console.log('Dia criado com sucesso:', data);
        return data;
      }
    },
    onSuccess: (_, variables) => {
      console.log('Mutation onSuccess, invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['civeni-program-days', variables.type] });
      toast({
        title: "Sucesso!",
        description: `Dia ${variables.editingDay ? 'atualizado' : 'criado'} com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('Mutation onError:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar dia.",
        variant: "destructive",
      });
    }
  });

  // Delete Day
  const deleteDayMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: EventType }) => {
      // First delete all sessions for this day
      const { error: sessionsError } = await supabase
        .from('civeni_program_sessions')
        .delete()
        .eq('day_id', id);
      
      if (sessionsError) throw sessionsError;

      // Then delete the day
      const { error } = await supabase
        .from('civeni_program_days')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['civeni-program-days', variables.type] });
      queryClient.invalidateQueries({ queryKey: ['civeni-program-sessions', variables.type] });
      toast({
        title: "Sucesso!",
        description: "Dia excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir dia.",
        variant: "destructive",
      });
    }
  });

  // Toggle Publish Day
  const togglePublishDayMutation = useMutation({
    mutationFn: async ({ id, is_published, type }: { id: string; is_published: boolean; type: EventType }) => {
      const { error } = await supabase
        .from('civeni_program_days')
        .update({ is_published })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['civeni-program-days', variables.type] });
      toast({
        title: "Sucesso!",
        description: `Dia ${variables.is_published ? 'publicado' : 'despublicado'} com sucesso.`,
      });
    }
  });

  // Create/Update Session
  const sessionUpsertMutation = useMutation({
    mutationFn: async ({ formData, editingSession, type }: { 
      formData: any; 
      editingSession: CiveniSession | null;
      type: EventType;
    }) => {
      console.log('sessionUpsertMutation executando com:', { formData, editingSession, type });

      if (!user || !sessionToken) {
        console.error('Sessão admin inválida ao salvar sessão CIVENI');
        throw new Error('Você precisa estar logado como administrador para salvar sessões.');
      }
      
      // Normalizar dados antes de enviar
      const sessionData: any = {
        day_id: formData.day_id,
        session_type: formData.session_type,
        title: formData.title,
        description: formData.description || null,
        start_at: formData.start_at,
        end_at: formData.end_at || null,
        room: formData.room || null,
        modality: formData.modality || null,
        livestream_url: formData.livestream_url || null,
        materials_url: formData.materials_url || null,
        is_parallel: formData.is_parallel || false,
        is_featured: formData.is_featured || false,
        order_in_day: typeof formData.order_in_day === 'number' ? formData.order_in_day : 0,
        is_published: formData.is_published || false,
      };

      // Incluir ID quando for edição para que o RPC faça UPDATE em vez de INSERT
      if (editingSession?.id) {
        (sessionData as any).id = editingSession.id;
      }

      const { data, error } = await supabase.rpc('admin_upsert_civeni_session', {
        session_data: sessionData,
        user_email: user.email,
        session_token: sessionToken,
      });

      if (error) {
        console.error('Erro ao salvar sessão via RPC admin_upsert_civeni_session:', error);
        throw error;
      }

      console.log('Sessão salva com sucesso via RPC:', data);
      return data;
    },
    onSuccess: (_, variables) => {
      console.log('Mutation onSuccess, invalidando queries');
      queryClient.invalidateQueries({ queryKey: ['civeni-program-sessions', variables.type] });
      toast({
        title: "Sucesso!",
        description: `Sessão ${variables.editingSession ? 'atualizada' : 'criada'} com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('Mutation onError:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar sessão.",
        variant: "destructive",
      });
    }
  });

  // Delete Session
  const deleteSessionMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: EventType }) => {
      const { error } = await supabase
        .from('civeni_program_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['civeni-program-sessions', variables.type] });
      toast({
        title: "Sucesso!",
        description: "Sessão excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir sessão.",
        variant: "destructive",
      });
    }
  });

  // Toggle Publish Session
  const togglePublishSessionMutation = useMutation({
    mutationFn: async ({ id, is_published, type }: { id: string; is_published: boolean; type: EventType }) => {
      const { error } = await supabase
        .from('civeni_program_sessions')
        .update({ is_published })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['civeni-program-sessions', variables.type] });
      toast({
        title: "Sucesso!",
        description: `Sessão ${variables.is_published ? 'publicada' : 'despublicada'} com sucesso.`,
      });
    }
  });

  return {
    useDays,
    useSessions,
    dayUpsertMutation,
    deleteDayMutation,
    togglePublishDayMutation,
    sessionUpsertMutation,
    deleteSessionMutation,
    togglePublishSessionMutation,
  };
};
