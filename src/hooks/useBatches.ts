
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Batch } from '@/types/registration';

export const useBatches = () => {
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentBatch = async () => {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      const { data: batch1, error: error1 } = await supabase
        .from('registration_batches')
        .select('*')
        .eq('batch_number', 1)
        .lte('start_date', todayString)
        .gte('end_date', todayString)
        .single();
      
      if (batch1 && !error1) {
        const endDate = new Date(batch1.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        setCurrentBatch({
          id: batch1.id,
          batch_number: batch1.batch_number,
          start_date: batch1.start_date,
          end_date: batch1.end_date,
          days_remaining: Math.max(0, daysRemaining)
        });
        return;
      }
      
      const { data: batch2, error: error2 } = await supabase
        .from('registration_batches')
        .select('*')
        .eq('batch_number', 2)
        .lte('start_date', todayString)
        .gte('end_date', todayString)
        .single();
      
      if (batch2 && !error2) {
        const endDate = new Date(batch2.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        setCurrentBatch({
          id: batch2.id,
          batch_number: batch2.batch_number,
          start_date: batch2.start_date,
          end_date: batch2.end_date,
          days_remaining: Math.max(0, daysRemaining)
        });
        return;
      }
      
      setCurrentBatch(null);
    } catch (error) {
      console.error('Error fetching current batch:', error);
      setCurrentBatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentBatch();
  }, []);

  return { currentBatch, loading };
};
