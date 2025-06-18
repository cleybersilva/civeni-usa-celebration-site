
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const FinancialDashboard = () => {
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Buscar estatísticas de inscrições
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('payment_status, amount_paid, created_at');

      if (regError) throw regError;

      const today = new Date().toISOString().split('T')[0];
      const totalRegistrations = registrations?.length || 0;
      const completedPayments = registrations?.filter(r => r.payment_status === 'completed').length || 0;
      const pendingPayments = registrations?.filter(r => r.payment_status === 'pending').length || 0;
      const totalRevenue = registrations?.filter(r => r.payment_status === 'completed')
        .reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0;
      
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
        total_revenue: totalRevenue,
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
  };

  const fetchAlerts = async () => {
    try {
      // Query alert_logs table directly with proper error handling
      const { data, error } = await supabase
        .from('alert_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar alertas:', error);
        setAlerts([]);
        return;
      }
      
      // Safely set alerts data
      const alertsData = data as AlertLog[] || [];
      setAlerts(alertsData);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      setAlerts([]);
    }
  };

  const generateDailyReport = async () => {
    try {
      // Call the generate_daily_report function directly
      const { data, error } = await supabase.rpc('generate_daily_report' as any);
      
      if (error) {
        console.error('Erro ao gerar relatório:', error);
        toast({
          title: "Erro",
          description: "Erro ao gerar relatório diário",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Relatório Gerado",
        description: "Relatório diário enviado com sucesso!"
      });
      
      fetchAlerts(); // Atualizar lista de alertas
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório diário",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchAlerts()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'new_registration':
        return <Users className="w-4 h-4" />;
      case 'payment_completed':
        return <DollarSign className="w-4 h-4" />;
      case 'daily_report':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels = {
      'new_registration': 'Nova Inscrição',
      'payment_completed': 'Pagamento Confirmado',
      'daily_report': 'Relatório Diário',
      'batch_started': 'Lote Iniciado',
      'batch_ended': 'Lote Encerrado'
    };
    return labels[alertType as keyof typeof labels] || alertType;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_registrations}</div>
            <p className="text-xs text-muted-foreground">
              Hoje: +{stats?.today_registrations}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Confirmados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed_payments}</div>
            <p className="text-xs text-muted-foreground">
              Pendentes: {stats?.pending_payments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Hoje: {formatCurrency(stats?.today_revenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total_registrations ? 
                Math.round((stats.completed_payments / stats.total_registrations) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos/Inscrições
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={generateDailyReport}>
              Gerar Relatório Diário
            </Button>
            <Button variant="outline" onClick={() => { fetchStats(); fetchAlerts(); }}>
              Atualizar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-muted-foreground">Nenhum alerta encontrado</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {alert.recipient_type.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {alert.recipient}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.status === 'sent' ? 'bg-green-100 text-green-700' :
                        alert.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
