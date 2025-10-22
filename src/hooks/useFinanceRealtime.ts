import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinanceKPIs {
  total_inscricoes: number;
  pagamentos_confirmados: number;
  receita_gross: number;
  receita_net: number;
  taxa_conversao: number;
  moeda: string;
  atualizado_em: string;
}

interface SeriesDataPoint {
  date: string;
  value: number;
  paid?: number;
  pending?: number;
}

interface BreakdownItem {
  category: string;
  payments: number;
  gross: number;
  net: number;
}

export const useFinanceRealtime = (range: string = '30d') => {
  const [kpis, setKpis] = useState<FinanceKPIs | null>(null);
  const [registrationSeries, setRegistrationSeries] = useState<SeriesDataPoint[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<SeriesDataPoint[]>([]);
  const [lotBreakdown, setLotBreakdown] = useState<BreakdownItem[]>([]);
  const [couponBreakdown, setCouponBreakdown] = useState<BreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchKPIs = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('finance-kpis', {
        body: { range }
      });

      if (error) throw error;
      setKpis(data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      toast({
        title: "Erro ao carregar KPIs",
        description: "Não foi possível atualizar os indicadores financeiros",
        variant: "destructive"
      });
    }
  }, [range, toast]);

  const fetchSeries = useCallback(async () => {
    try {
      // Buscar séries de inscrições
      const { data: regData, error: regError } = await supabase.functions.invoke('finance-series', {
        body: { metric: 'inscricoes', interval: 'day', range }
      });

      if (regError) throw regError;
      setRegistrationSeries(regData?.data || []);

      // Buscar séries de receita
      const { data: revData, error: revError } = await supabase.functions.invoke('finance-series', {
        body: { metric: 'revenue_net', interval: 'day', range }
      });

      if (revError) throw revError;
      setRevenueSeries(revData?.data || []);
    } catch (error) {
      console.error('Error fetching series:', error);
      toast({
        title: "Erro ao carregar séries temporais",
        description: "Não foi possível atualizar os gráficos",
        variant: "destructive"
      });
    }
  }, [range, toast]);

  const fetchBreakdowns = useCallback(async () => {
    try {
      console.log('🔄 Fetching breakdowns for range:', range);
      
      // Buscar breakdown por lote
      const { data: lotData, error: lotError } = await supabase.functions.invoke('finance-breakdown', {
        body: { by: 'lot', range }
      });

      if (lotError) {
        console.error('❌ Error fetching lot breakdown:', lotError);
        throw lotError;
      }
      
      console.log('✅ Lot breakdown data:', lotData?.data);
      setLotBreakdown(lotData?.data || []);

      // Buscar breakdown por cupom
      const { data: couponData, error: couponError } = await supabase.functions.invoke('finance-breakdown', {
        body: { by: 'coupon', range }
      });

      if (couponError) {
        console.error('❌ Error fetching coupon breakdown:', couponError);
        throw couponError;
      }
      
      console.log('✅ Coupon breakdown data:', couponData?.data);
      setCouponBreakdown(couponData?.data || []);
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
      toast({
        title: "Erro ao carregar análises",
        description: "Não foi possível atualizar os relatórios detalhados",
        variant: "destructive"
      });
    }
  }, [range, toast]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchKPIs(),
        fetchSeries(),
        fetchBreakdowns()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchKPIs, fetchSeries, fetchBreakdowns]);

  // Carregar dados iniciais
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Configurar realtime para stripe_payments e event_registrations
  useEffect(() => {
    console.log('🔌 Setting up real-time subscriptions...');
    
    const paymentsChannel = supabase
      .channel('stripe_payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stripe_payments'
        },
        (payload) => {
          console.log('💰 Stripe payment updated:', payload);
          // Debounce: aguardar 500ms antes de atualizar
          setTimeout(() => {
            console.log('🔄 Refreshing dashboard due to payment change...');
            refreshAll();
          }, 500);
        }
      )
      .subscribe();

    const registrationsChannel = supabase
      .channel('registrations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_registrations'
        },
        (payload) => {
          console.log('📝 Registration updated:', payload);
          setTimeout(() => {
            console.log('🔄 Refreshing dashboard due to registration change...');
            refreshAll();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions...');
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(registrationsChannel);
    };
  }, [refreshAll]);

  return {
    kpis,
    registrationSeries,
    revenueSeries,
    lotBreakdown,
    couponBreakdown,
    loading,
    refreshAll
  };
};