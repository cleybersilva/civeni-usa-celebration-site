
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCards from './dashboard/StatsCards';
import ActionsCard from './dashboard/ActionsCard';
import AlertsLog from './dashboard/AlertsLog';
import RegistrationCharts from './dashboard/RegistrationCharts';
import RevenueCharts from './dashboard/RevenueCharts';
import RegistrationReports from './dashboard/RegistrationReports';
import { useFinancialData } from './dashboard/hooks/useFinancialData';
import { useChartData } from './dashboard/hooks/useChartData';

const FinancialDashboard = () => {
  const {
    stats,
    alerts,
    loading,
    generateDailyReport,
    refreshData
  } = useFinancialData();

  const {
    registrationCharts,
    revenueCharts,
    loading: chartsLoading,
    fetchChartData
  } = useChartData();

  useEffect(() => {
    refreshData();
    fetchChartData();
  }, [refreshData, fetchChartData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsCards stats={null} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
      <ActionsCard 
        onGenerateReport={generateDailyReport}
        onRefreshData={() => {
          refreshData();
          fetchChartData();
        }}
      />
      
      <Tabs defaultValue="graficos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="graficos" className="space-y-6">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Gráficos de Inscrições</h3>
              {chartsLoading ? (
                <div className="text-center py-8">Carregando gráficos...</div>
              ) : (
                <RegistrationCharts
                  dailyData={registrationCharts.daily}
                  weeklyData={registrationCharts.weekly}
                  batchData={registrationCharts.batch}
                />
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Gráficos de Faturamento</h3>
              {chartsLoading ? (
                <div className="text-center py-8">Carregando gráficos...</div>
              ) : (
                <RevenueCharts
                  dailyData={revenueCharts.daily}
                  weeklyData={revenueCharts.weekly}
                  batchData={revenueCharts.batch}
                />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="relatorios">
          <RegistrationReports />
        </TabsContent>
        
        <TabsContent value="alertas">
          <AlertsLog alerts={alerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
