
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RegistrationCategory {
  id: string;
  category_name: string;
  price_brl: number;
  requires_proof: boolean;
  is_exempt: boolean;
  batch_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useRegistrationCategories = () => {
  const [categories, setCategories] = useState<RegistrationCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<RegistrationCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      await loadCategories();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error };
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<RegistrationCategory>) => {
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .update({ ...categoryData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await loadCategories();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating category:', error);
      return { success: false, error };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('registration_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadCategories();
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories
  };
};
