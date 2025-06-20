
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <div className="space-y-6 h-full">
        <StatsCards stats={null} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 space-y-6">
        <StatsCards stats={stats} />
        <ActionsCard 
          onGenerateReport={generateDailyReport}
          onRefreshData={() => {
            refreshData();
            fetchChartData();
          }}
        />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="graficos" className="h-full flex flex-col">
          <div className="flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="graficos">Gráficos</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="alertas">Alertas</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="graficos" className="h-full m-0 p-0">
              <ScrollArea className="h-full">
                <div className="space-y-8 p-6">
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
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="relatorios" className="h-full m-0 p-0">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <RegistrationReports />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="alertas" className="h-full m-0 p-0">
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
