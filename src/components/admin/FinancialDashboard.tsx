
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Shield, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
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

  // Helper function to group data by week
  const groupByWeek = (series: typeof registrationSeries) => {
    const weekMap = new Map<string, { value: number; startDate: string }>();
    
    series.forEach(d => {
      const date = new Date(d.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (weekMap.has(weekKey)) {
        const existing = weekMap.get(weekKey)!;
        weekMap.set(weekKey, { value: existing.value + d.value, startDate: weekKey });
      } else {
        weekMap.set(weekKey, { value: d.value, startDate: weekKey });
      }
    });
    
    return Array.from(weekMap.values()).map(w => ({
      name: new Date(w.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      value: w.value,
      periodo: w.startDate
    }));
  };

  // Transformar dados do realtime para formato dos gráficos
  const dailyRegistrations = registrationSeries.map((d) => ({
    name: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    inscricoes: d.value,
    periodo: d.date
  }));

  const weeklyRegistrations = groupByWeek(registrationSeries).map(w => ({
    name: w.name,
    inscricoes: w.value,
    periodo: w.periodo
  }));

  const dailyRevenue = revenueSeries.map((d) => ({
    name: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    faturamento: d.value,
    periodo: d.date
  }));

  const weeklyRevenue = groupByWeek(revenueSeries).map(w => ({
    name: w.name,
    faturamento: w.value,
    periodo: w.periodo
  }));

  const batchRegistrations = lotBreakdown.map(b => ({
    name: b.category,
    inscricoes: b.payments,
    periodo: b.category
  }));

  const batchRevenue = lotBreakdown.map(b => ({
    name: b.category,
    faturamento: b.net,
    periodo: b.category
  }));

  // Função para exportar Gráficos em PDF
  const exportGraficosPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Relatório de Gráficos - Dashboard Financeiro', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`III Civeni USA 2025 | Período: ${range === '7d' ? 'Últimos 7 dias' : range === '30d' ? 'Últimos 30 dias' : range === '90d' ? 'Últimos 90 dias' : 'Todos os períodos'}`, pageWidth / 2, 25, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 30, { align: 'center' });
      
      let yPos = 45;
      
      // KPIs Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicadores-Chave (KPIs)', 14, yPos);
      yPos += 10;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Métrica', 'Valor']],
        body: [
          ['Total de Inscrições', kpis?.total_inscricoes?.toString() || '0'],
          ['Receita Líquida', `R$ ${(kpis?.receita_net || 0).toFixed(2)}`],
          ['Receita Bruta', `R$ ${(kpis?.receita_gross || 0).toFixed(2)}`],
          ['Taxa de Conversão', `${(kpis?.taxa_conversao || 0).toFixed(1)}%`],
          ['Pagamentos Confirmados', kpis?.pagamentos_confirmados?.toString() || '0']
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Inscrições Diárias
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Inscrições Diárias', 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Quantidade']],
        body: dailyRegistrations.map(d => [d.name, d.inscricoes.toString()]),
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 14, right: 14 }
      });
      
      // Nova página para Revenue
      doc.addPage();
      yPos = 20;
      
      // Faturamento Diário
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Faturamento Diário', 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Valor (R$)']],
        body: dailyRevenue.map(d => [d.name, d.faturamento.toFixed(2)]),
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247] },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Por Lote
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise por Lote', 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Lote', 'Inscrições', 'Receita (R$)', 'Ticket Médio (R$)']],
        body: lotBreakdown.map(b => [
          b.category,
          b.payments.toString(),
          b.net.toFixed(2),
          (b.net / b.payments).toFixed(2)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
        margin: { left: 14, right: 14 }
      });
      
      doc.save(`relatorio_graficos_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Gerado",
        description: "Relatório de Gráficos exportado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF de Gráficos",
        variant: "destructive"
      });
    }
  };

  // Função para exportar Gráficos em Excel
  const exportGraficosExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: KPIs
      const kpisData = [
        ['INDICADORES-CHAVE (KPIs)'],
        [''],
        ['Métrica', 'Valor'],
        ['Total de Inscrições', kpis?.total_inscricoes || 0],
        ['Receita Líquida', `R$ ${(kpis?.receita_net || 0).toFixed(2)}`],
        ['Receita Bruta', `R$ ${(kpis?.receita_gross || 0).toFixed(2)}`],
        ['Taxa de Conversão', `${(kpis?.taxa_conversao || 0).toFixed(1)}%`],
        ['Pagamentos Confirmados', kpis?.pagamentos_confirmados || 0],
        ['Moeda', kpis?.moeda || 'BRL'],
        [''],
        ['Gerado em:', new Date().toLocaleString('pt-BR')]
      ];
      const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
      XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');
      
      // Sheet 2: Inscrições Diárias
      const inscricoesData = [
        ['INSCRIÇÕES DIÁRIAS'],
        [''],
        ['Data', 'Quantidade'],
        ...dailyRegistrations.map(d => [d.name, d.inscricoes])
      ];
      const wsInscricoes = XLSX.utils.aoa_to_sheet(inscricoesData);
      XLSX.utils.book_append_sheet(wb, wsInscricoes, 'Inscrições Diárias');
      
      // Sheet 3: Inscrições Semanais
      const inscricoesSemana = [
        ['INSCRIÇÕES SEMANAIS'],
        [''],
        ['Semana', 'Quantidade'],
        ...weeklyRegistrations.map(d => [d.name, d.inscricoes])
      ];
      const wsInscrSem = XLSX.utils.aoa_to_sheet(inscricoesSemana);
      XLSX.utils.book_append_sheet(wb, wsInscrSem, 'Inscrições Semanais');
      
      // Sheet 4: Faturamento Diário
      const fatDiario = [
        ['FATURAMENTO DIÁRIO'],
        [''],
        ['Data', 'Valor (R$)'],
        ...dailyRevenue.map(d => [d.name, d.faturamento])
      ];
      const wsFatDiario = XLSX.utils.aoa_to_sheet(fatDiario);
      XLSX.utils.book_append_sheet(wb, wsFatDiario, 'Faturamento Diário');
      
      // Sheet 5: Faturamento Semanal
      const fatSemanal = [
        ['FATURAMENTO SEMANAL'],
        [''],
        ['Semana', 'Valor (R$)'],
        ...weeklyRevenue.map(d => [d.name, d.faturamento])
      ];
      const wsFatSemanal = XLSX.utils.aoa_to_sheet(fatSemanal);
      XLSX.utils.book_append_sheet(wb, wsFatSemanal, 'Faturamento Semanal');
      
      // Sheet 6: Por Lote
      const porLote = [
        ['ANÁLISE POR LOTE'],
        [''],
        ['Lote', 'Inscrições', 'Receita (R$)', 'Ticket Médio (R$)'],
        ...lotBreakdown.map(b => [
          b.category,
          b.payments,
          b.net,
          b.net / b.payments
        ])
      ];
      const wsPorLote = XLSX.utils.aoa_to_sheet(porLote);
      XLSX.utils.book_append_sheet(wb, wsPorLote, 'Por Lote');
      
      // Sheet 7: Por Cupom
      if (couponBreakdown && couponBreakdown.length > 0) {
        const porCupom = [
          ['ANÁLISE POR CUPOM'],
          [''],
          ['Cupom', 'Pagamentos', 'Receita Bruta (R$)', 'Receita Líquida (R$)'],
          ...couponBreakdown.map(c => [
            c.category || 'Sem cupom',
            c.payments,
            c.gross,
            c.net
          ])
        ];
        const wsPorCupom = XLSX.utils.aoa_to_sheet(porCupom);
        XLSX.utils.book_append_sheet(wb, wsPorCupom, 'Por Cupom');
      }
      
      XLSX.writeFile(wb, `relatorio_graficos_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Excel Gerado",
        description: "Relatório de Gráficos exportado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar Excel de Gráficos",
        variant: "destructive"
      });
    }
  };

  // Função para exportar Alertas em PDF
  const exportAlertasPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(239, 68, 68);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Relatório de Alertas - Dashboard Financeiro', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text('III Civeni USA 2025', pageWidth / 2, 23, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
      
      let yPos = 45;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo de Alertas', 14, yPos);
      yPos += 10;
      
      const alertTypes = alerts.reduce((acc: any, alert: any) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {});
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tipo de Alerta', 'Quantidade']],
        body: Object.entries(alertTypes).map(([type, count]) => [type, count]),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento de Alertas', 14, yPos);
      yPos += 8;
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data/Hora', 'Tipo', 'Mensagem', 'Prioridade']],
        body: alerts.map((alert: any) => [
          new Date(alert.created_at).toLocaleString('pt-BR'),
          alert.type,
          alert.message,
          alert.priority || 'Normal'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 }
      });
      
      doc.save(`relatorio_alertas_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Gerado",
        description: "Relatório de Alertas exportado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF de Alertas",
        variant: "destructive"
      });
    }
  };

  // Função para exportar Alertas em Excel
  const exportAlertasExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: Resumo
      const alertTypes = alerts.reduce((acc: any, alert: any) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      }, {});
      
      const resumoData = [
        ['RESUMO DE ALERTAS'],
        [''],
        ['Tipo de Alerta', 'Quantidade'],
        ...Object.entries(alertTypes).map(([type, count]) => [type, count]),
        [''],
        ['Total de Alertas', alerts.length],
        [''],
        ['Gerado em:', new Date().toLocaleString('pt-BR')]
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
      
      // Sheet 2: Detalhamento
      const detailData = [
        ['DETALHAMENTO DE ALERTAS'],
        [''],
        ['Data/Hora', 'Tipo', 'Mensagem', 'Prioridade'],
        ...alerts.map((alert: any) => [
          new Date(alert.created_at).toLocaleString('pt-BR'),
          alert.type,
          alert.message,
          alert.priority || 'Normal'
        ])
      ];
      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhamento');
      
      XLSX.writeFile(wb, `relatorio_alertas_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Excel Gerado",
        description: "Relatório de Alertas exportado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar Excel de Alertas",
        variant: "destructive"
      });
    }
  };

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
                  <div className="flex justify-end gap-2 mb-4">
                    <Button onClick={exportGraficosPDF} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button onClick={exportGraficosExcel} variant="outline" size="sm">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                  <div className="w-full">
                    <h3 className="text-xl font-semibold mb-6">{t('admin.dashboard.registrationCharts', 'Gráficos de Inscrições')}</h3>
                    {realtimeLoading ? (
                      <div className="text-center py-8">{t('admin.dashboard.loadingCharts', 'Carregando gráficos...')}</div>
                    ) : (
                      <div className="w-full">
                        <RegistrationCharts
                          dailyData={dailyRegistrations}
                          weeklyData={weeklyRegistrations}
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
                          weeklyData={weeklyRevenue}
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
                  <div className="flex justify-end gap-2 mb-4">
                    <Button onClick={exportAlertasPDF} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Exportar PDF
                    </Button>
                    <Button onClick={exportAlertasExcel} variant="outline" size="sm">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
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
