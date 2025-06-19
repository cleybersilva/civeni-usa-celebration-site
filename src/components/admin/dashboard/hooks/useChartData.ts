
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChartData {
  name: string;
  inscricoes?: number;
  faturamento?: number;
  periodo: string;
}

export const useChartData = () => {
  const [registrationCharts, setRegistrationCharts] = useState<{
    daily: ChartData[];
    weekly: ChartData[];
    batch: ChartData[];
  }>({
    daily: [],
    weekly: [],
    batch: []
  });

  const [revenueCharts, setRevenueCharts] = useState<{
    daily: ChartData[];
    weekly: ChartData[];
    batch: ChartData[];
  }>({
    daily: [],
    weekly: [],
    batch: []
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar dados de inscrições
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select(`
          *,
          registration_categories(category_name),
          registration_batches(batch_number, start_date, end_date)
        `);

      if (regError) throw regError;

      // Processar dados diários (últimos 7 dias)
      const dailyRegistrations: { [key: string]: number } = {};
      const dailyRevenue: { [key: string]: number } = {};
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(date => {
        dailyRegistrations[date] = 0;
        dailyRevenue[date] = 0;
      });

      registrations?.forEach(reg => {
        const regDate = reg.created_at.split('T')[0];
        if (dailyRegistrations.hasOwnProperty(regDate)) {
          dailyRegistrations[regDate]++;
          if (reg.payment_status === 'completed') {
            dailyRevenue[regDate] += reg.amount_paid || 0;
          }
        }
      });

      // Processar dados semanais (últimas 4 semanas)
      const weeklyRegistrations: { [key: string]: number } = {};
      const weeklyRevenue: { [key: string]: number } = {};
      
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekKey = `Sem ${4 - i}`;
        weeklyRegistrations[weekKey] = 0;
        weeklyRevenue[weekKey] = 0;

        registrations?.forEach(reg => {
          const regDate = new Date(reg.created_at);
          if (regDate >= weekStart && regDate <= weekEnd) {
            weeklyRegistrations[weekKey]++;
            if (reg.payment_status === 'completed') {
              weeklyRevenue[weekKey] += reg.amount_paid || 0;
            }
          }
        });
      }

      // Processar dados por lote
      const batchRegistrations: { [key: string]: number } = {};
      const batchRevenue: { [key: string]: number } = {};

      registrations?.forEach(reg => {
        const batchKey = `Lote ${reg.registration_batches?.batch_number || 'N/A'}`;
        batchRegistrations[batchKey] = (batchRegistrations[batchKey] || 0) + 1;
        
        if (reg.payment_status === 'completed') {
          batchRevenue[batchKey] = (batchRevenue[batchKey] || 0) + (reg.amount_paid || 0);
        }
      });

      // Formatear dados para os gráficos
      setRegistrationCharts({
        daily: last7Days.map(date => ({
          name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
          inscricoes: dailyRegistrations[date],
          periodo: date
        })),
        weekly: Object.entries(weeklyRegistrations).map(([week, count]) => ({
          name: week,
          inscricoes: count,
          periodo: week
        })),
        batch: Object.entries(batchRegistrations).map(([batch, count]) => ({
          name: batch,
          inscricoes: count,
          periodo: batch
        }))
      });

      setRevenueCharts({
        daily: last7Days.map(date => ({
          name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
          faturamento: dailyRevenue[date],
          periodo: date
        })),
        weekly: Object.entries(weeklyRevenue).map(([week, revenue]) => ({
          name: week,
          faturamento: revenue,
          periodo: week
        })),
        batch: Object.entries(batchRevenue).map(([batch, revenue]) => ({
          name: batch,
          faturamento: revenue,
          periodo: batch
        }))
      });

    } catch (error) {
      console.error('Erro ao buscar dados dos gráficos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos gráficos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    registrationCharts,
    revenueCharts,
    loading,
    fetchChartData
  };
};
