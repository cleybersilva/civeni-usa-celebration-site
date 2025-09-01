import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EventCategory } from './useEventCategories';

export const usePublicEventCategories = () => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPublicCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_category')
        .select('*')
        .eq('is_active', true)
        .eq('is_promotional', false)
        .order('order_index');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading public categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicCategories();
  }, []);

  return {
    categories,
    loading,
    refreshCategories: loadPublicCategories
  };
};