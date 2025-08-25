import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ParticipantType {
  id: string;
  type_name: string;
  description: string | null;
  requires_course_selection: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useParticipantTypes = () => {
  const [participantTypes, setParticipantTypes] = useState<ParticipantType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParticipantTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('participant_types')
        .select('*')
        .order('type_name');

      if (error) throw error;
      setParticipantTypes(data || []);
    } catch (error) {
      console.error('Error loading participant types:', error);
    } finally {
      setLoading(false);
    }
  };

  const createParticipantType = async (typeData: Omit<ParticipantType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('participant_types')
        .insert([typeData])
        .select()
        .single();

      if (error) throw error;
      await loadParticipantTypes();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating participant type:', error);
      return { success: false, error };
    }
  };

  const updateParticipantType = async (id: string, typeData: Partial<ParticipantType>) => {
    try {
      const { data, error } = await supabase
        .from('participant_types')
        .update({ 
          ...typeData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await loadParticipantTypes();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating participant type:', error);
      return { success: false, error };
    }
  };

  const deleteParticipantType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('participant_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadParticipantTypes();
      return { success: true };
    } catch (error) {
      console.error('Error deleting participant type:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    loadParticipantTypes();
  }, []);

  return {
    participantTypes,
    loading,
    createParticipantType,
    updateParticipantType,
    deleteParticipantType,
    refreshParticipantTypes: loadParticipantTypes
  };
};