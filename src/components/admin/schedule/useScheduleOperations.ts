
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScheduleFormData } from './scheduleSchema';

export const useScheduleOperations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedules
  const useSchedules = (type: 'presencial' | 'online') => {
    return useQuery({
      queryKey: ['admin-schedules', type],
      queryFn: async () => {
        console.log(`Admin fetching schedules for type: ${type}`);
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('type', type)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (error) {
          console.error('Error fetching admin schedules:', error);
          throw error;
        }
        
        console.log(`Admin fetched ${data?.length || 0} schedules for ${type}`);
        return data || [];
      },
    });
  };

  // Create/Update schedule mutation
  const scheduleUpsertMutation = useMutation({
    mutationFn: async ({ formData, editingSchedule }: { formData: ScheduleFormData; editingSchedule?: any }) => {
      console.log('Upserting schedule:', { formData, editingSchedule });
      
      // Get session data
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;
      
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          throw new Error('Sessão administrativa inválida. Faça login novamente.');
        }
      }

      if (!sessionEmail || !sessionToken) {
        throw new Error('Sessão administrativa inválida. Faça login novamente.');
      }

      const scheduleData = {
        ...formData,
        ...(editingSchedule?.id && { id: editingSchedule.id })
      };

      const { data: result, error } = await supabase.rpc('admin_upsert_schedule', {
        schedule: scheduleData,
        user_email: sessionEmail,
        session_token: sessionToken,
      });

      if (error) {
        console.error('Error upserting schedule:', error);
        throw error;
      }

      return result;
    },
    onSuccess: (_, { editingSchedule }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: editingSchedule ? 'Programação atualizada' : 'Programação criada',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error upserting schedule:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a programação.',
        variant: 'destructive',
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting schedule:', id);
      
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;
      
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          throw new Error('Sessão administrativa inválida. Faça login novamente.');
        }
      }

      if (!sessionEmail || !sessionToken) {
        throw new Error('Sessão administrativa inválida. Faça login novamente.');
      }

      const { data: result, error } = await supabase.rpc('admin_delete_schedule', {
        schedule_id: id,
        user_email: sessionEmail,
        session_token: sessionToken,
      });

      if (error) {
        console.error('Error deleting schedule:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: 'Programação excluída',
        description: 'O item foi removido com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir a programação.',
        variant: 'destructive',
      });
    },
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      console.log('Toggling publish status:', { id, is_published });
      
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '';
      let sessionToken: string | undefined;
      
      if (sessionRaw) {
        try {
          const parsed = JSON.parse(sessionRaw);
          sessionEmail = parsed?.user?.email || '';
          sessionToken = parsed?.session_token || parsed?.sessionToken;
        } catch (e) {
          console.warn('Failed to read admin session from localStorage');
          throw new Error('Sessão administrativa inválida. Faça login novamente.');
        }
      }

      if (!sessionEmail || !sessionToken) {
        throw new Error('Sessão administrativa inválida. Faça login novamente.');
      }

      const { data: result, error } = await supabase.rpc('admin_toggle_publish_schedule', {
        schedule_id: id,
        is_published,
        user_email: sessionEmail,
        session_token: sessionToken,
      });

      if (error) {
        console.error('Error toggling publish status:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (error) => {
      console.error('Error toggling publish status:', error);
    },
  });

  return {
    useSchedules,
    scheduleUpsertMutation,
    deleteScheduleMutation,
    togglePublishMutation,
  };
};
