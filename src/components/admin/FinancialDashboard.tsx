
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
import { supabase } from '@/integrations/supabase/client';
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
  const exportGraficosPDF = async () => {
    if (realtimeLoading) {
      toast({
        title: "Aguarde",
        description: "Os dados ainda estão sendo carregados...",
        variant: "destructive"
      });
      return;
    }
    
    // Buscar dados completos
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Dashboard Financeiro - Relatório Completo', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(11);
      doc.text('III Civeni USA 2025', pageWidth / 2, 24, { align: 'center' });
      doc.text(`Período: ${range === '7d' ? 'Últimos 7 dias' : range === '30d' ? 'Últimos 30 dias' : range === '90d' ? 'Últimos 90 dias' : 'Todos os períodos'}`, pageWidth / 2, 31, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 37, { align: 'center' });
      
      let yPos = 50;
      
      // PÁGINA 1: KPIs e Resumo Executivo
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Executivo', 14, yPos);
      yPos += 10;
      
      const ticketMedio = kpis?.receita_net && kpis?.pagamentos_confirmados 
        ? (kpis.receita_net / kpis.pagamentos_confirmados).toFixed(2)
        : '0.00';
      
      const taxasStripe = kpis?.receita_gross && kpis?.receita_net 
        ? (kpis.receita_gross - kpis.receita_net).toFixed(2)
        : '0.00';
      
      autoTable(doc, {
        startY: yPos,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de Inscrições', kpis?.total_inscricoes?.toString() || '0'],
          ['Pagamentos Confirmados', kpis?.pagamentos_confirmados?.toString() || '0'],
          ['Receita Bruta', `R$ ${(kpis?.receita_gross || 0).toFixed(2)}`],
          ['Taxas Stripe', `R$ ${taxasStripe}`],
          ['Receita Líquida', `R$ ${(kpis?.receita_net || 0).toFixed(2)}`],
          ['Ticket Médio', `R$ ${ticketMedio}`],
          ['Taxa de Conversão', `${(kpis?.taxa_conversao || 0).toFixed(1)}%`],
          ['Moeda', kpis?.moeda || 'BRL']
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 11, fontStyle: 'bold' },
        bodyStyles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Análise por Status de Pagamento
      if (registrations && registrations.length > 0) {
        const statusCount = registrations.reduce((acc: any, reg: any) => {
          acc[reg.payment_status] = (acc[reg.payment_status] || 0) + 1;
          return acc;
        }, {});
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Distribuição por Status de Pagamento', 14, yPos);
        yPos += 8;
        
        autoTable(doc, {
          startY: yPos,
          head: [['Status', 'Quantidade', 'Percentual']],
          body: Object.entries(statusCount).map(([status, count]: [string, any]) => [
            status === 'completed' ? 'Pago' : status === 'pending' ? 'Pendente' : status,
            count.toString(),
            `${((count / registrations.length) * 100).toFixed(1)}%`
          ]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 14, right: 14 }
        });
      }
      
      // PÁGINA 2: Inscrições por Período
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise Temporal - Inscrições', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text('Inscrições Diárias', 14, yPos);
      yPos += 6;
      
      const totalInscricoesDia = dailyRegistrations.reduce((sum, d) => sum + d.inscricoes, 0);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Quantidade']],
        body: [
          ...dailyRegistrations.map(d => [d.name, d.inscricoes.toString()]),
          ['TOTAL', totalInscricoesDia.toString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.row.index === dailyRegistrations.length && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [220, 252, 231];
          }
        }
      });
      
      // PÁGINA 3: Faturamento
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise Temporal - Faturamento', 14, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      doc.text('Faturamento Diário', 14, yPos);
      yPos += 6;
      
      const totalFatDia = dailyRevenue.reduce((sum, d) => sum + d.faturamento, 0);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Valor (R$)']],
        body: [
          ...dailyRevenue.map(d => [d.name, d.faturamento.toFixed(2)]),
          ['TOTAL', totalFatDia.toFixed(2)]
        ],
        theme: 'striped',
        headStyles: { fillColor: [168, 85, 247] },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.row.index === dailyRevenue.length && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 232, 255];
          }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Faturamento Semanal
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.text('Faturamento Semanal', 14, yPos);
      yPos += 6;
      
      const totalFatSem = weeklyRevenue.reduce((sum, d) => sum + d.faturamento, 0);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Semana', 'Valor (R$)']],
        body: [
          ...weeklyRevenue.map(d => [d.name, d.faturamento.toFixed(2)]),
          ['TOTAL', totalFatSem.toFixed(2)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [168, 85, 247] },
        bodyStyles: { fontSize: 10 },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.row.index === weeklyRevenue.length && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 232, 255];
          }
        }
      });
      
      // PÁGINA 4: Análise por Lote
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Análise Detalhada por Lote', 14, yPos);
      yPos += 10;
      
      const totalLoteInscr = lotBreakdown.reduce((sum, b) => sum + b.payments, 0);
      const totalLoteBruto = lotBreakdown.reduce((sum, b) => sum + b.gross, 0);
      const totalLoteLiq = lotBreakdown.reduce((sum, b) => sum + b.net, 0);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Lote', 'Inscrições', 'Receita Bruta', 'Receita Líquida', 'Ticket Médio']],
        body: [
          ...lotBreakdown.map(b => [
            b.category,
            b.payments.toString(),
            `R$ ${b.gross.toFixed(2)}`,
            `R$ ${b.net.toFixed(2)}`,
            `R$ ${(b.net / b.payments).toFixed(2)}`
          ]),
          ['TOTAIS', 
            totalLoteInscr.toString(),
            `R$ ${totalLoteBruto.toFixed(2)}`,
            `R$ ${totalLoteLiq.toFixed(2)}`,
            `R$ ${(totalLoteLiq / totalLoteInscr).toFixed(2)}`
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
        didParseCell: (data: any) => {
          if (data.row.index === lotBreakdown.length && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [254, 243, 199];
          }
        }
      });
      
      // Análise por Cupom (se houver)
      if (couponBreakdown && couponBreakdown.length > 0) {
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise por Cupom de Desconto', 14, yPos);
        yPos += 8;
        
        const totalCupPag = couponBreakdown.reduce((sum, c) => sum + c.payments, 0);
        const totalCupBruto = couponBreakdown.reduce((sum, c) => sum + c.gross, 0);
        const totalCupLiq = couponBreakdown.reduce((sum, c) => sum + c.net, 0);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Cupom', 'Pagamentos', 'Receita Bruta', 'Receita Líquida']],
          body: [
            ...couponBreakdown.map(c => [
              c.category || 'Sem cupom',
              c.payments.toString(),
              `R$ ${c.gross.toFixed(2)}`,
              `R$ ${c.net.toFixed(2)}`
            ]),
            ['TOTAIS',
              totalCupPag.toString(),
              `R$ ${totalCupBruto.toFixed(2)}`,
              `R$ ${totalCupLiq.toFixed(2)}`
            ]
          ],
          theme: 'striped',
          headStyles: { fillColor: [14, 165, 233] },
          bodyStyles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
          didParseCell: (data: any) => {
            if (data.row.index === couponBreakdown.length && data.section === 'body') {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [224, 242, 254];
            }
          }
        });
      }
      
      // Rodapé em todas as páginas
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
        doc.text('III Civeni USA 2025 - Dashboard Financeiro', 14, 287);
      }
      
      doc.save(`dashboard_financeiro_completo_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "✅ PDF Gerado com Sucesso!",
        description: `Relatório completo de ${pageCount} páginas baixado com sucesso!`
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
  const exportGraficosExcel = async () => {
    if (realtimeLoading) {
      toast({
        title: "Aguarde",
        description: "Os dados ainda estão sendo carregados...",
        variant: "destructive"
      });
      return;
    }
    
    // Buscar dados completos das inscrições
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (regError) {
      toast({
        title: "Erro",
        description: "Erro ao buscar dados das inscrições",
        variant: "destructive"
      });
      return;
    }
    
    // Buscar dados do Stripe
    const { data: stripeCharges, error: stripeError } = await supabase
      .from('stripe_charges')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (stripeError) {
      console.warn('Aviso ao buscar charges:', stripeError);
    }
    try {
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: KPIs
      const kpisData = [
        ['DASHBOARD FINANCEIRO - III CIVENI USA 2025'],
        ['Período:', range === '7d' ? 'Últimos 7 dias' : range === '30d' ? 'Últimos 30 dias' : range === '90d' ? 'Últimos 90 dias' : 'Todos os períodos'],
        ['Gerado em:', new Date().toLocaleString('pt-BR')],
        [''],
        ['INDICADORES-CHAVE (KPIs)'],
        ['Métrica', 'Valor'],
        ['Total de Inscrições', kpis?.total_inscricoes || 0],
        ['Pagamentos Confirmados', kpis?.pagamentos_confirmados || 0],
        ['Receita Bruta', kpis?.receita_gross ? `R$ ${kpis.receita_gross.toFixed(2)}` : 'R$ 0,00'],
        ['Taxas Stripe', kpis?.receita_gross && kpis?.receita_net ? `R$ ${(kpis.receita_gross - kpis.receita_net).toFixed(2)}` : 'R$ 0,00'],
        ['Receita Líquida', kpis?.receita_net ? `R$ ${kpis.receita_net.toFixed(2)}` : 'R$ 0,00'],
        ['Taxa de Conversão', `${(kpis?.taxa_conversao || 0).toFixed(1)}%`],
        ['Ticket Médio', kpis?.receita_net && kpis?.pagamentos_confirmados ? `R$ ${(kpis.receita_net / kpis.pagamentos_confirmados).toFixed(2)}` : 'R$ 0,00'],
        ['Moeda', kpis?.moeda || 'BRL'],
        ['']
      ];
      const wsKPIs = XLSX.utils.aoa_to_sheet(kpisData);
      XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');
      
      // Sheet 2: Inscrições Completas
      const inscricoesCompletas = [
        ['INSCRIÇÕES COMPLETAS - DETALHAMENTO'],
        [''],
        ['ID', 'Nome', 'Email', 'Status', 'Valor', 'Moeda', 'Cupom', 'Método', 'Bandeira', 'Parcelas', 'Data Criação', 'Última Atualização'],
        ...(registrations || []).map((reg: any) => [
          reg.id,
          reg.full_name || '',
          reg.email || '',
          reg.payment_status || '',
          reg.amount_paid || 0,
          reg.currency || 'BRL',
          reg.coupon_code || 'Sem cupom',
          reg.payment_method || 'N/A',
          reg.card_brand || 'N/A',
          reg.installments || 1,
          reg.created_at ? new Date(reg.created_at).toLocaleString('pt-BR') : '',
          reg.updated_at ? new Date(reg.updated_at).toLocaleString('pt-BR') : ''
        ])
      ];
      const wsInscricoes = XLSX.utils.aoa_to_sheet(inscricoesCompletas);
      XLSX.utils.book_append_sheet(wb, wsInscricoes, 'Inscrições Completas');
      
      // Sheet 3: Inscrições Diárias
      const inscricoesData = [
        ['INSCRIÇÕES POR DIA'],
        [''],
        ['Data', 'Quantidade de Inscrições'],
        ...dailyRegistrations.map(d => [d.name, d.inscricoes]),
        [''],
        ['Total', dailyRegistrations.reduce((sum, d) => sum + d.inscricoes, 0)]
      ];
      const wsInscrDia = XLSX.utils.aoa_to_sheet(inscricoesData);
      XLSX.utils.book_append_sheet(wb, wsInscrDia, 'Inscrições Diárias');
      
      // Sheet 4: Inscrições Semanais
      const inscricoesSemana = [
        ['INSCRIÇÕES POR SEMANA'],
        [''],
        ['Semana', 'Quantidade de Inscrições'],
        ...weeklyRegistrations.map(d => [d.name, d.inscricoes]),
        [''],
        ['Total', weeklyRegistrations.reduce((sum, d) => sum + d.inscricoes, 0)]
      ];
      const wsInscrSem = XLSX.utils.aoa_to_sheet(inscricoesSemana);
      XLSX.utils.book_append_sheet(wb, wsInscrSem, 'Inscrições Semanais');
      
      // Sheet 5: Faturamento Diário
      const fatDiario = [
        ['FATURAMENTO POR DIA'],
        [''],
        ['Data', 'Valor (R$)'],
        ...dailyRevenue.map(d => [d.name, d.faturamento.toFixed(2)]),
        [''],
        ['Total', dailyRevenue.reduce((sum, d) => sum + d.faturamento, 0).toFixed(2)]
      ];
      const wsFatDiario = XLSX.utils.aoa_to_sheet(fatDiario);
      XLSX.utils.book_append_sheet(wb, wsFatDiario, 'Faturamento Diário');
      
      // Sheet 6: Faturamento Semanal
      const fatSemanal = [
        ['FATURAMENTO POR SEMANA'],
        [''],
        ['Semana', 'Valor (R$)'],
        ...weeklyRevenue.map(d => [d.name, d.faturamento.toFixed(2)]),
        [''],
        ['Total', weeklyRevenue.reduce((sum, d) => sum + d.faturamento, 0).toFixed(2)]
      ];
      const wsFatSemanal = XLSX.utils.aoa_to_sheet(fatSemanal);
      XLSX.utils.book_append_sheet(wb, wsFatSemanal, 'Faturamento Semanal');
      
      // Sheet 7: Análise por Lote
      const porLote = [
        ['ANÁLISE POR LOTE'],
        [''],
        ['Lote', 'Qtd Inscrições', 'Receita Bruta (R$)', 'Receita Líquida (R$)', 'Ticket Médio (R$)'],
        ...lotBreakdown.map(b => [
          b.category,
          b.payments,
          b.gross.toFixed(2),
          b.net.toFixed(2),
          (b.net / b.payments).toFixed(2)
        ]),
        [''],
        ['TOTAIS', 
          lotBreakdown.reduce((sum, b) => sum + b.payments, 0),
          lotBreakdown.reduce((sum, b) => sum + b.gross, 0).toFixed(2),
          lotBreakdown.reduce((sum, b) => sum + b.net, 0).toFixed(2),
          ''
        ]
      ];
      const wsPorLote = XLSX.utils.aoa_to_sheet(porLote);
      XLSX.utils.book_append_sheet(wb, wsPorLote, 'Análise por Lote');
      
      // Sheet 8: Análise por Cupom
      if (couponBreakdown && couponBreakdown.length > 0) {
        const porCupom = [
          ['ANÁLISE POR CUPOM'],
          [''],
          ['Cupom', 'Qtd Pagamentos', 'Receita Bruta (R$)', 'Receita Líquida (R$)'],
          ...couponBreakdown.map(c => [
            c.category || 'Sem cupom',
            c.payments,
            c.gross.toFixed(2),
            c.net.toFixed(2)
          ]),
          [''],
          ['TOTAIS',
            couponBreakdown.reduce((sum, c) => sum + c.payments, 0),
            couponBreakdown.reduce((sum, c) => sum + c.gross, 0).toFixed(2),
            couponBreakdown.reduce((sum, c) => sum + c.net, 0).toFixed(2)
          ]
        ];
        const wsPorCupom = XLSX.utils.aoa_to_sheet(porCupom);
        XLSX.utils.book_append_sheet(wb, wsPorCupom, 'Análise por Cupom');
      }
      
      // Sheet 9: Transações Stripe (se disponível)
      if (stripeCharges && stripeCharges.length > 0) {
        const transacoes = [
          ['TRANSAÇÕES STRIPE - DETALHAMENTO'],
          [''],
          ['ID Charge', 'Valor', 'Moeda', 'Status', 'Bandeira', 'País', 'Data', 'Cliente Email'],
          ...(stripeCharges || []).slice(0, 1000).map((charge: any) => [
            charge.charge_id || '',
            charge.amount || 0,
            charge.currency || '',
            charge.status || '',
            charge.brand || '',
            charge.country || '',
            charge.created ? new Date(charge.created * 1000).toLocaleString('pt-BR') : '',
            charge.customer_email || ''
          ])
        ];
        const wsTransacoes = XLSX.utils.aoa_to_sheet(transacoes);
        XLSX.utils.book_append_sheet(wb, wsTransacoes, 'Transações Stripe');
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
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Relatórios de Inscrições</h3>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            const reports = document.querySelector('[data-registration-reports]');
                            if (reports) {
                              // Trigger CSV export from RegistrationReports
                              const csvBtn = reports.querySelector('[data-export-csv]') as HTMLButtonElement;
                              csvBtn?.click();
                            }
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Exportar CSV
                        </Button>
                        <Button 
                          onClick={() => {
                            const reports = document.querySelector('[data-registration-reports]');
                            if (reports) {
                              // Trigger PDF export from RegistrationReports
                              const pdfBtn = reports.querySelector('[data-export-pdf]') as HTMLButtonElement;
                              pdfBtn?.click();
                            }
                          }}
                          variant="outline" 
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Exportar PDF
                        </Button>
                      </div>
                    </div>
                  </div>
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
