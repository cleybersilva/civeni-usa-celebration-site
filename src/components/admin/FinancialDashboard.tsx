
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import StatsCards from './dashboard/StatsCards';
import ActionsCard from './dashboard/ActionsCard';
import AlertsLog from './dashboard/AlertsLog';
import RegistrationCharts from './dashboard/RegistrationCharts';
import RevenueCharts from './dashboard/RevenueCharts';
import RegistrationReports from './dashboard/RegistrationReports';
import { useFinancialData } from './dashboard/hooks/useFinancialData';
import { useFinanceRealtime } from '@/hooks/useFinanceRealtime';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const FinancialDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAdminAuth();
  const [range, setRange] = useState('30d');
  
  // Only admin_root can access financial data
  if (user?.user_type !== 'admin_root') {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso restrito: Apenas usuários Admin Root podem visualizar dados financeiros.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const {
    stats,
    alerts,
    loading,
    generateDailyReport,
    refreshData
  } = useFinancialData();

  const {
    kpis,
    registrationSeries,
    revenueSeries,
    lotBreakdown,
    couponBreakdown,
    loading: realtimeLoading,
    refreshAll
  } = useFinanceRealtime(range);

  useEffect(() => {
    refreshData();
    refreshAll();
  }, [range, refreshData, refreshAll]);

  if (loading) {
    return (
      <div className="space-y-6 h-full">
        <StatsCards stats={null} />
      </div>
    );
  }

  // Transformar dados do realtime para formato dos gráficos
  const dailyRegistrations = registrationSeries.map((d, i) => ({
    name: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    inscricoes: d.value,
    periodo: d.date
  }));

  const dailyRevenue = revenueSeries.map((d, i) => ({
    name: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
    faturamento: d.value,
    periodo: d.date
  }));

  const batchRegistrations = lotBreakdown.slice(0, 5).map(b => ({
    name: b.category,
    inscricoes: b.payments,
    periodo: b.category
  }));

  const batchRevenue = lotBreakdown.slice(0, 5).map(b => ({
    name: b.category,
    faturamento: b.net,
    periodo: b.category
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Dashboard Financeiro em Tempo Real</h3>
            <p className="text-sm text-muted-foreground">
              Dados sincronizados com Stripe • Atualização automática
            </p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todos os períodos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <StatsCards stats={stats} />
        <ActionsCard 
          onGenerateReport={generateDailyReport}
          onRefreshData={() => {
            refreshData();
            refreshAll();
          }}
        />
      </div>
      
      <div className="flex-1 min-h-0">
        <Tabs defaultValue="graficos" className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="graficos">{t('admin.dashboard.charts', 'Gráficos')}</TabsTrigger>
              <TabsTrigger value="relatorios">{t('admin.dashboard.reports', 'Relatórios')}</TabsTrigger>
              <TabsTrigger value="alertas">{t('admin.dashboard.alerts', 'Alertas')}</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 min-h-0">
            <TabsContent value="graficos" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-8">
                  <div className="w-full">
                    <h3 className="text-xl font-semibold mb-6">{t('admin.dashboard.registrationCharts', 'Gráficos de Inscrições')}</h3>
                    {realtimeLoading ? (
                      <div className="text-center py-8">{t('admin.dashboard.loadingCharts', 'Carregando gráficos...')}</div>
                    ) : (
                      <div className="w-full">
                        <RegistrationCharts
                          dailyData={dailyRegistrations}
                          weeklyData={[]}
                          batchData={batchRegistrations}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full">
                    <h3 className="text-xl font-semibold mb-6">{t('admin.dashboard.revenueCharts', 'Gráficos de Faturamento')}</h3>
                    {realtimeLoading ? (
                      <div className="text-center py-8">{t('admin.dashboard.loadingCharts', 'Carregando gráficos...')}</div>
                    ) : (
                      <div className="w-full">
                        <RevenueCharts
                          dailyData={dailyRevenue}
                          weeklyData={[]}
                          batchData={batchRevenue}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="relatorios" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <RegistrationReports />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="alertas" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <AlertsLog alerts={alerts} />
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default FinancialDashboard;
