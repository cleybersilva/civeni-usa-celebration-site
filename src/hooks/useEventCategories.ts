import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EventCategory {
  id: string;
  event_id: string;
  slug: string;
  order_index: number;
  is_active: boolean;
  is_free: boolean;
  is_promotional: boolean;
  currency: string;
  price_cents: number | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  quota_total: number | null;
  available_from: string | null;
  available_until: string | null;
  lot_id: string | null;
  title_pt: string;
  title_en: string | null;
  title_es: string | null;
  title_tr: string | null;
  description_pt: string | null;
  description_en: string | null;
  description_es: string | null;
  description_tr: string | null;
  sync_status: string;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export const useEventCategories = () => {
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Get session data for admin context
      const savedSession = localStorage.getItem('adminSession');
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        if (sessionData.session_token && sessionData.expires > Date.now()) {
          // Set admin context for this query
          await supabase.rpc('set_current_user_email_secure', {
            user_email: sessionData.user.email,
            session_token: sessionData.session_token
          });
        }
      }

      const { data, error } = await supabase
        .from('event_category')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<EventCategory, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'sync_error'>) => {
    try {
      // Get session data for secure RLS context
      const savedSession = localStorage.getItem('adminSession');
      if (!savedSession) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const sessionData = JSON.parse(savedSession);
      if (!sessionData.session_token || sessionData.expires <= Date.now()) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      // Ensure we use the correct event_id from existing categories if needed
      let finalCategory = { ...categoryData } as typeof categoryData;
      const placeholderId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      if (!finalCategory.event_id || finalCategory.event_id === placeholderId) {
        const { data: existing, error: fetchErr } = await supabase
          .from('event_category')
          .select('event_id')
          .limit(1);
        if (fetchErr) throw fetchErr;
        const existingEventId = existing && existing.length > 0 ? existing[0].event_id : null;
        if (existingEventId) {
          finalCategory.event_id = existingEventId;
        } else {
          throw new Error('ID do evento não configurado. Crie ao menos uma categoria padrão ou configure o evento.');
        }
      }

      // Use secure function that handles RLS properly
      const { data, error } = await supabase.rpc('create_event_category_secure', {
        category: {
          ...finalCategory,
          sync_status: 'pending'
        },
        user_email: sessionData.user.email,
        session_token: sessionData.session_token
      });

      if (error) throw error;
      
      const newCategory = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Trigger Stripe sync
      if (!categoryData.is_free && newCategory.id) {
        await syncWithStripe(newCategory.id);
      }
      
      await loadCategories();
      return { success: true, data: newCategory };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error };
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<EventCategory>) => {
    try {
      const { data, error } = await supabase
        .from('event_category')
        .update({ 
          ...categoryData, 
          updated_at: new Date().toISOString(),
          sync_status: 'pending'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Trigger Stripe sync
      await syncWithStripe(id);
      
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
        .from('event_category')
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

  const syncWithStripe = async (categoryId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-category-stripe', {
        body: { categoryId }
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error syncing with Stripe:', error);
      return { success: false, error };
    }
  };

  const updateOrder = async (categoryId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('event_category')
        .update({ order_index: newOrder })
        .eq('id', categoryId);

      if (error) throw error;
      await loadCategories();
      return { success: true };
    } catch (error) {
      console.error('Error updating order:', error);
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
    syncWithStripe,
    updateOrder,
    refreshCategories: loadCategories
  };
};