import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

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

  // Fetch days
  const useDays = (type: EventType) => {
    return useQuery({
      queryKey: ['civeni-program-days', type],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('civeni_program_days')
          .select('*')
          .eq('event_slug', getEventSlug(type))
          .order('sort_order');
        
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
      formData: CiveniDayUpdate; 
      editingDay: CiveniDay | null;
      type: EventType;
    }) => {
      const dayData: CiveniDayUpdate = {
        ...formData,
        event_slug: getEventSlug(type),
        updated_at: new Date().toISOString()
      };

      if (editingDay) {
        const { data, error } = await supabase
          .from('civeni_program_days')
          .update(dayData)
          .eq('id', editingDay.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const insertData: CiveniDayInsert = dayData as CiveniDayInsert;
        const { data, error } = await supabase
          .from('civeni_program_days')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['civeni-program-days', variables.type] });
      toast({
        title: "Sucesso!",
        description: `Dia ${variables.editingDay ? 'atualizado' : 'criado'} com sucesso.`,
      });
    },
    onError: (error: any) => {
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
      formData: CiveniSessionUpdate; 
      editingSession: CiveniSession | null;
      type: EventType;
    }) => {
      const sessionData: CiveniSessionUpdate = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      if (editingSession) {
        const { data, error } = await supabase
          .from('civeni_program_sessions')
          .update(sessionData)
          .eq('id', editingSession.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const insertData: CiveniSessionInsert = sessionData as CiveniSessionInsert;
        const { data, error } = await supabase
          .from('civeni_program_sessions')
          .insert(insertData)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['civeni-program-sessions', variables.type] });
      toast({
        title: "Sucesso!",
        description: `Sessão ${variables.editingSession ? 'atualizada' : 'criada'} com sucesso.`,
      });
    },
    onError: (error: any) => {
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
