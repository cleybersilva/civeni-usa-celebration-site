
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount' | 'category_override';
  discount_value: number | null;
  category_id: string | null;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number | null;
  created_at: string;
  updated_at: string;
}

export const useCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupon_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (couponData: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'used_count'>) => {
    try {
      const { data, error } = await supabase
        .from('coupon_codes')
        .insert([{ ...couponData, used_count: 0 }])
        .select()
        .single();

      if (error) throw error;
      await loadCoupons();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating coupon:', error);
      return { success: false, error };
    }
  };

  const updateCoupon = async (id: string, couponData: Partial<Coupon>) => {
    try {
      const { data, error } = await supabase
        .from('coupon_codes')
        .update({ ...couponData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await loadCoupons();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating coupon:', error);
      return { success: false, error };
    }
  };

  const deleteCoupon = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coupon_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadCoupons();
      return { success: true };
    } catch (error) {
      console.error('Error deleting coupon:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  return {
    coupons,
    loading,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    refreshCoupons: loadCoupons
  };
};
