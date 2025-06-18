
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
      queryKey: ['schedules', type],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('type', type)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (error) throw error;
        return data;
      },
    });
  };

  // Create/Update schedule mutation
  const scheduleUpsertMutation = useMutation({
    mutationFn: async ({ formData, editingSchedule }: { formData: ScheduleFormData; editingSchedule?: any }) => {
      // Ensure all required fields are present for database insertion
      const dataToInsert = {
        type: formData.type,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        title: formData.title,
        category: formData.category,
        description: formData.description || null,
        speaker_name: formData.speaker_name || null,
        speaker_photo_url: formData.speaker_photo_url || null,
        location: formData.location || null,
        virtual_link: formData.virtual_link || null,
        platform: formData.platform || null,
        is_recorded: formData.is_recorded,
        recording_url: formData.recording_url || null,
        is_published: formData.is_published,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('schedules')
          .update(dataToInsert)
          .eq('id', editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert(dataToInsert);
        if (error) throw error;
      }
    },
    onSuccess: (_, { editingSchedule }) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: editingSchedule ? 'Cronograma atualizado' : 'Cronograma criado',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o cronograma.',
        variant: 'destructive',
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: 'Cronograma excluído',
        description: 'O item foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o cronograma.',
        variant: 'destructive',
      });
    },
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('schedules')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  return {
    useSchedules,
    scheduleUpsertMutation,
    deleteScheduleMutation,
    togglePublishMutation,
  };
};
