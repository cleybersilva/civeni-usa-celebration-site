import { supabase } from '@/integrations/supabase/client';

export const syncCategoryWithStripe = async (categoryId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-category-stripe', {
      body: { categoryId }
    });

    if (error) {
      console.error('Error syncing category with Stripe:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error calling sync function:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};