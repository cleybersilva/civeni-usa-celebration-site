
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category, Batch } from '@/types/registration';

export const useCategories = (currentBatch: Batch | null) => {
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCategories = async () => {
    if (!currentBatch) return;
    
    try {
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('batch_id', currentBatch.id);
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentBatch]);

  return { categories };
};
