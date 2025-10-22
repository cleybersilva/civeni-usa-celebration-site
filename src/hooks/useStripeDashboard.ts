import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripeSummary {
  bruto: number;
  taxas: number;
  liquido: number;
  pagos: number;
  naoPagos: number;
  falhas: number;
  reembolsos: number;
  disputas: number;
  ticketMedio: number;
  taxaConversao: string;
  proximoPayout: any;
}

export const useStripeDashboard = (range: string = '30d') => {
  const [summary, setSummary] = useState<StripeSummary | null>(null);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [byBrand, setByBrand] = useState<any[]>([]);
  const [funnel, setFunnel] = useState<any>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - (parseInt(range) || 30) * 24 * 60 * 60 * 1000).toISOString();
      const to = now.toISOString();

      console.log('🔄 Fetching Stripe dashboard data...', { from, to, range });

      const [summaryRes, timeseriesRes, brandRes, funnelRes, chargesRes, customersRes] = await Promise.all([
        supabase.functions.invoke('finance-summary', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => {
          console.log('📊 Summary response:', res);
          return res;
        }),
        supabase.functions.invoke('finance-timeseries', { 
          method: 'GET'
        }).then(res => {
          console.log('📈 Timeseries response:', res);
          return res;
        }),
        supabase.functions.invoke('finance-by-brand', { 
          method: 'GET'
        }).then(res => {
          console.log('💳 By-brand response:', res);
          return res;
        }),
        supabase.functions.invoke('finance-funnel', { 
          method: 'GET'
        }).then(res => {
          console.log('🔽 Funnel response:', res);
          return res;
        }),
        supabase.functions.invoke('finance-charges', { 
          method: 'GET'
        }).then(res => {
          console.log('💰 Charges response:', res);
          return res;
        }),
        supabase.functions.invoke('finance-customers', {
          method: 'GET'
        }).then(res => {
          console.log('👥 Customers response:', res);
          return res;
        })
      ]);

      if (summaryRes.error) {
        console.error('Summary error:', summaryRes.error);
      } else if (summaryRes.data) {
        console.log('✅ Summary data:', summaryRes.data);
        setSummary(summaryRes.data);
      }

      if (timeseriesRes.data) setTimeseries(timeseriesRes.data.data || timeseriesRes.data || []);
      if (brandRes.data) setByBrand(brandRes.data.data || brandRes.data || []);
      if (funnelRes.data) setFunnel(funnelRes.data);
      if (chargesRes.data) setCharges(chargesRes.data.data || chargesRes.data || []);
      if (customersRes.data) setCustomers(customersRes.data.data || customersRes.data || []);

    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
      toast({
        title: "Erro ao carregar dashboard",
        description: error.message || "Não foi possível carregar os dados financeiros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [range, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('stripe_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stripe_charges' }, () => {
        console.log('💰 Stripe charge updated, refreshing...');
        setTimeout(fetchAll, 1000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  return { summary, timeseries, byBrand, funnel, charges, customers, loading, refresh: fetchAll };
};
