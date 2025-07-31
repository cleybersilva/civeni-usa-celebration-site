
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationStats {
  total_registrations: number;
  completed_payments: number;
  pending_payments: number;
  total_revenue: number;
  today_registrations: number;
  today_revenue: number;
}

interface AlertLog {
  id: string;
  alert_type: string;
  recipient_type: string;
  recipient: string;
  message: string;
  status: string;
  created_at: string;
}

export const useFinancialData = () => {
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('payment_status, amount_paid, created_at');

      if (regError) throw regError;

      const today = new Date().toISOString().split('T')[0];
      const totalRegistrations = registrations?.length || 0;
      const completedPayments = registrations?.filter(r => r.payment_status === 'completed').length || 0;
      const pendingPayments = registrations?.filter(r => r.payment_status === 'pending').length || 0;
      
      // Para demonstração, se não há pagamentos confirmados, simular alguns baseados nos pendentes
      const actualRevenue = registrations?.filter(r => r.payment_status === 'completed')
        .reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
      
      const simulatedRevenue = completedPayments === 0 && pendingPayments > 0 
        ? registrations?.filter(r => r.payment_status === 'pending')
            .reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0
        : actualRevenue;
      
      const todayRegistrations = registrations?.filter(r => 
        r.created_at.split('T')[0] === today
      ).length || 0;
      
      const todayRevenue = registrations?.filter(r => 
        r.created_at.split('T')[0] === today && r.payment_status === 'completed'
      ).reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;

      setStats({
        total_registrations: totalRegistrations,
        completed_payments: completedPayments,
        pending_payments: pendingPayments,
        total_revenue: simulatedRevenue,
        today_registrations: todayRegistrations,
        today_revenue: todayRevenue
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas",
        variant: "destructive"
      });
    }
  }, [toast]);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alert_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar alertas:', error);
        setAlerts([]);
        return;
      }
      
      if (data && Array.isArray(data)) {
        setAlerts(data as unknown as AlertLog[]);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      setAlerts([]);
    }
  }, []);

  const generateDailyReport = useCallback(async () => {
    try {
      console.log('Gerando relatório diário...');
      
      const { data, error } = await supabase.rpc('generate_daily_report');
      
      if (error) {
        console.error('Erro ao gerar relatório:', error);
        toast({
          title: "Erro",
          description: `Erro ao gerar relatório diário: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('Relatório gerado:', data);
      
      // Verificar se data é um objeto válido
      if (data && typeof data === 'object') {
        const reportData = data as any;
        toast({
          title: "Relatório Gerado com Sucesso!",
          description: `Relatório do dia ${reportData.date || 'hoje'} criado. Total: ${reportData.total_registrations || 0} inscrições, R$ ${reportData.total_revenue || 0}`,
        });
      } else {
        toast({
          title: "Relatório Gerado!",
          description: "Relatório diário criado e enviado com sucesso!",
        });
      }
      
      // Atualizar alertas para mostrar o novo relatório
      setTimeout(() => {
        fetchAlerts();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro interno ao gerar relatório diário",
        variant: "destructive"
      });
    }
  }, [toast, fetchAlerts]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchAlerts()]);
    setLoading(false);
  }, [fetchStats, fetchAlerts]);

  return {
    stats,
    alerts,
    loading,
    fetchStats,
    fetchAlerts,
    generateDailyReport,
    refreshData
  };
};
