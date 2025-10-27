
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStripeDashboard } from '@/hooks/useStripeDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, CreditCard, DollarSign, Users, AlertTriangle, Download, Database, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StripeFilters } from './stripe/StripeFilters';
import { RevenueChart } from './stripe/RevenueChart';
import { BrandChart } from './stripe/BrandChart';
import { FunnelChart } from './stripe/FunnelChart';
import { ChargesTable } from './stripe/ChargesTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, sessionToken } = useAdminAuth();
  const [filters, setFilters] = useState({
    range: '30d',
    status: 'all',
    lote: '',
    cupom: '',
    brand: 'all',
    customFrom: undefined,
    customTo: undefined
  });
  const [syncing, setSyncing] = useState(false);

  const { summary, timeseries, byBrand, funnel, charges, customers, loading, refresh } = useStripeDashboard(filters);
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      range: '30d',
      status: 'all',
      lote: '',
      cupom: '',
      brand: 'all',
      customFrom: undefined,
      customTo: undefined
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-sync', {
        body: {
          since: filters.customFrom?.toISOString(),
          until: filters.customTo?.toISOString(),
          resources: ['payment_intents', 'charges', 'refunds', 'payouts', 'customers']
        }
      });

      if (error) throw error;

      toast({
        title: "Sincronização concluída!",
        description: `${data.synced} registros sincronizados do Stripe`,
      });

      refresh();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar dados do Stripe",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteCustomer = async (email: string) => {
    if (!confirm(`Tem certeza que deseja excluir todos os registros de ${email}?`)) {
      return;
    }

    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar autenticado",
        variant: "destructive"
      });
      return;
    }

    setDeletingCustomer(email);
    try {
      console.log('🗑️ Tentando excluir registros de:', email);
      
      // Chamar a Edge Function para fazer a exclusão com service role
      const { data, error } = await supabase.functions.invoke('delete-customer-registrations', {
        body: { email }
      });

      console.log('🗑️ Resultado da exclusão:', { data, error });

      if (error) {
        console.error('❌ Erro na exclusão:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao excluir registros');
      }

      toast({
        title: "Registros excluídos!",
        description: `${data.deleted_count} registro(s) de ${email} foram removidos`,
      });

      // Aguardar um pouco antes de atualizar
      setTimeout(() => {
        refresh();
      }, 500);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir os registros",
        variant: "destructive"
      });
    } finally {
      setDeletingCustomer(null);
    }
  };

  // Relatório de Transações
  const handleExportTransacoesPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text('Relatório de Transações - Civeni 2025', 14, 15);
    
    doc.setFontSize(10);
    let periodo = '';
    if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
      periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
    } else {
      const days = parseInt(filters.range) || 30;
      periodo = `Últimos ${days} dias`;
    }
    doc.text(`Período: ${periodo}`, 14, 25);
    
    if (summary) {
      doc.text(`Total de Transações: ${charges.length} | Valor Total: ${formatCurrency(summary.bruto)}`, 14, 32);
    }
    
    const transacoesData = charges.map((charge: any) => {
      const created = new Date(charge.created * 1000);
      const dataBRT = created.toLocaleDateString('pt-BR');
      const horaBRT = created.toLocaleTimeString('pt-BR');
      const valorBruto = charge.amount / 100;
      const taxa = charge.fee ? charge.fee / 100 : 0;
      const liquido = charge.net ? charge.net / 100 : valorBruto - taxa;
      
      return [
        `${dataBRT} ${horaBRT}`,
        charge.customer_email || '-',
        charge.metadata?.participant_name || '-',
        charge.id?.substring(0, 12) || '-',
        formatCurrency(valorBruto),
        formatCurrency(taxa),
        formatCurrency(liquido),
        charge.status === 'succeeded' ? 'Pago' : charge.status === 'pending' ? 'Pendente' : 'Falhou',
        charge.payment_method_details?.card?.brand?.toUpperCase() || charge.payment_method_details?.type || '-',
        `*${charge.payment_method_details?.card?.last4 || '****'}`,
        charge.metadata?.lote || charge.metadata?.cupom || '-'
      ];
    });
    
    autoTable(doc, {
      head: [['Data/Hora (BRT)', 'Cliente', 'Participante', 'ID Transação', 'Valor Bruto', 'Taxa', 'Líquido', 'Status', 'Método/Bandeira', 'Cartão', 'Lote/Cupom']],
      body: transacoesData,
      startY: 40,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 18 },
        8: { cellWidth: 25 },
        9: { cellWidth: 15 },
        10: { cellWidth: 20 }
      }
    });
    
    doc.save(`relatorio-transacoes-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF exportado!",
      description: "Relatório de transações baixado com sucesso",
    });
  };

  const handleExportTransacoesExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const transacoesData = charges.map((charge: any) => {
      const created = new Date(charge.created * 1000);
      const dataBRT = created.toLocaleDateString('pt-BR');
      const horaBRT = created.toLocaleTimeString('pt-BR');
      const valorBruto = charge.amount / 100;
      const taxa = charge.fee ? charge.fee / 100 : 0;
      const liquido = charge.net ? charge.net / 100 : valorBruto - taxa;
      
      return {
        'Data/Hora (BRT)': `${dataBRT} ${horaBRT}`,
        'Cliente': charge.customer_email || '-',
        'Participante': charge.metadata?.participant_name || '-',
        'ID Transação': charge.id || '-',
        'Valor Bruto': `R$ ${valorBruto.toFixed(2)}`,
        'Taxa': `R$ ${taxa.toFixed(2)}`,
        'Líquido': `R$ ${liquido.toFixed(2)}`,
        'Status': charge.status === 'succeeded' ? 'Pago' : charge.status === 'pending' ? 'Pendente' : 'Falhou',
        'Método/Bandeira': charge.payment_method_details?.card?.brand?.toUpperCase() || charge.payment_method_details?.type || '-',
        'Cartão': charge.payment_method_details?.card?.last4 ? `**** **** **** ${charge.payment_method_details.card.last4}` : '-',
        'Lote/Cupom': charge.metadata?.lote || charge.metadata?.cupom || '-'
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(transacoesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');
    
    XLSX.writeFile(wb, `relatorio-transacoes-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel exportado!",
      description: "Relatório de transações baixado com sucesso",
    });
  };

  // Relatório de Clientes
  const handleExportClientesPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text('Relatório de Clientes - Civeni 2025', 14, 15);
    
    doc.setFontSize(10);
    let periodo = '';
    if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
      periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
    } else {
      const days = parseInt(filters.range) || 30;
      periodo = `Últimos ${days} dias`;
    }
    doc.text(`Período: ${periodo}`, 14, 25);
    doc.text(`Total de Clientes: ${customers.length}`, 14, 32);
    
    const clientesData = customers.map((customer: any) => [
      customer.email || '-',
      customer.nome || '-',
      customer.pagamentos || 0,
      formatCurrency(customer.total_gasto || 0),
      formatCurrency(customer.reembolsos_valor || 0),
      customer.criado || '-',
      `${customer.card_brand || '-'} ${customer.last4 ? '****' + customer.last4 : ''}`
    ]);
    
    autoTable(doc, {
      head: [['Email', 'Nome', 'Pagamentos', 'Total Gasto', 'Reembolsos', 'Criado', 'Método Padrão']],
      body: clientesData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
        6: { cellWidth: 40 }
      }
    });
    
    doc.save(`relatorio-clientes-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF exportado!",
      description: "Relatório de clientes baixado com sucesso",
    });
  };

  const handleExportClientesExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const clientesData = customers.map((customer: any) => ({
      'Email': customer.email || '-',
      'Nome': customer.nome || '-',
      'Total de Pagamentos': customer.pagamentos || 0,
      'Total Gasto': formatCurrency(customer.total_gasto || 0),
      'Total Reembolsado': formatCurrency(customer.reembolsos_valor || 0),
      'Data de Criação': customer.criado || '-',
      'Método Padrão': customer.card_brand || '-',
      'Últimos 4 Dígitos': customer.last4 || '-',
      'Link Stripe': customer.stripe_link || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(clientesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    
    XLSX.writeFile(wb, `relatorio-clientes-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel exportado!",
      description: "Relatório de clientes baixado com sucesso",
    });
  };

  // Relatório de Análises
  const handleExportAnalisesPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text('Relatório de Análises Avançadas - Civeni 2025', 14, 15);
    
    doc.setFontSize(10);
    let periodo = '';
    if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
      periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
    } else {
      const days = parseInt(filters.range) || 30;
      periodo = `Últimos ${days} dias`;
    }
    doc.text(`Período: ${periodo}`, 14, 25);
    
    // Resumo KPIs
    if (summary) {
      doc.setFontSize(12);
      doc.text('Resumo Financeiro', 14, 38);
      doc.setFontSize(9);
      doc.text(`Receita Bruta: ${formatCurrency(summary.bruto)}`, 14, 45);
      doc.text(`Taxas: ${formatCurrency(summary.taxas)}`, 14, 52);
      doc.text(`Receita Líquida: ${formatCurrency(summary.liquido)}`, 14, 59);
      doc.text(`Pagamentos Confirmados: ${summary.pagos}`, 100, 45);
      doc.text(`Pagamentos Pendentes: ${summary.naoPagos}`, 100, 52);
      doc.text(`Ticket Médio: ${formatCurrency(summary.ticketMedio)}`, 100, 59);
    }
    
    // Análise por Bandeira
    doc.setFontSize(12);
    doc.text('Análise por Bandeira de Cartão', 14, 75);
    
    const bandeirasData = byBrand.map((brand: any) => [
      brand.brand?.toUpperCase() || '-',
      brand.count || 0,
      formatCurrency((brand.amount || 0) / 100),
      `${charges.length > 0 ? ((brand.count / charges.length) * 100).toFixed(1) : 0}%`
    ]);
    
    autoTable(doc, {
      head: [['Bandeira', 'Transações', 'Valor Total', 'Percentual']],
      body: bandeirasData,
      startY: 82,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Série Temporal (últimos registros)
    if (timeseries && timeseries.length > 0) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text('Série Temporal de Receita', 14, 15);
      
      const serieData = timeseries.slice(-30).map((item: any) => [
        item.date || '-',
        formatCurrency((item.gross_revenue || 0) / 100),
        formatCurrency((item.net_revenue || 0) / 100),
        item.transaction_count || 0
      ]);
      
      autoTable(doc, {
        head: [['Data', 'Receita Bruta', 'Receita Líquida', 'Transações']],
        body: serieData,
        startY: 25,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      });
    }
    
    // Funil de Conversão
    if (funnel && funnel.steps) {
      doc.addPage();
      doc.setFontSize(12);
      doc.text('Funil de Conversão', 14, 15);
      
      const funnelData = funnel.steps.map((step: any) => [
        step.name || '-',
        step.count || 0,
        `${step.percentage?.toFixed(1) || 0}%`
      ]);
      
      autoTable(doc, {
        head: [['Etapa', 'Quantidade', 'Percentual']],
        body: funnelData,
        startY: 25,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      const finalY = 25 + (funnelData.length * 10) + 20;
      doc.setFontSize(10);
      doc.text(`Taxa de Conversão Total: ${funnel.conversionRate?.toFixed(2) || 0}%`, 14, finalY);
    }
    
    doc.save(`relatorio-analises-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF exportado!",
      description: "Relatório de análises baixado com sucesso",
    });
  };

  const handleExportAnalisesExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo
    const resumoData = [
      ['Relatório de Análises Avançadas - Civeni 2025'],
      [''],
      ['Período', filters.range === 'custom' && filters.customFrom && filters.customTo 
        ? `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`
        : `Últimos ${parseInt(filters.range) || 30} dias`
      ],
      [''],
      ['KPI', 'Valor'],
      ['Receita Bruta', formatCurrency(summary?.bruto || 0)],
      ['Taxas', formatCurrency(summary?.taxas || 0)],
      ['Receita Líquida', formatCurrency(summary?.liquido || 0)],
      ['Pagamentos Confirmados', summary?.pagos || 0],
      ['Pagamentos Pendentes', summary?.naoPagos || 0],
      ['Falhas', summary?.falhas || 0],
      ['Reembolsos', summary?.reembolsos || 0],
      ['Ticket Médio', formatCurrency(summary?.ticketMedio || 0)],
      ['Taxa de Conversão', `${summary?.taxaConversao || 0}%`]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    // Sheet 2: Análise por Bandeira
    const brandData = byBrand.map((brand: any) => ({
      'Bandeira': brand.brand?.toUpperCase() || '-',
      'Número de Transações': brand.count || 0,
      'Valor Total': formatCurrency((brand.amount || 0) / 100),
      'Percentual do Total': `${charges.length > 0 ? ((brand.count / charges.length) * 100).toFixed(2) : 0}%`
    }));
    const wsBrand = XLSX.utils.json_to_sheet(brandData);
    XLSX.utils.book_append_sheet(wb, wsBrand, 'Por Bandeira');
    
    // Sheet 3: Série Temporal
    if (timeseries && timeseries.length > 0) {
      const serieData = timeseries.map((item: any) => ({
        'Data': item.date || '-',
        'Receita Bruta': formatCurrency((item.gross_revenue || 0) / 100),
        'Receita Líquida': formatCurrency((item.net_revenue || 0) / 100),
        'Número de Transações': item.transaction_count || 0
      }));
      const wsSerie = XLSX.utils.json_to_sheet(serieData);
      XLSX.utils.book_append_sheet(wb, wsSerie, 'Série Temporal');
    }
    
    // Sheet 4: Funil de Conversão
    if (funnel && funnel.steps) {
      const funnelData = funnel.steps.map((step: any) => ({
        'Etapa': step.name || '-',
        'Quantidade': step.count || 0,
        'Percentual': `${step.percentage?.toFixed(2) || 0}%`
      }));
      const wsFunnel = XLSX.utils.json_to_sheet(funnelData);
      XLSX.utils.book_append_sheet(wb, wsFunnel, 'Funil de Conversão');
    }
    
    XLSX.writeFile(wb, `relatorio-analises-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel exportado!",
      description: "Relatório de análises baixado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro Stripe</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="secondary" className="animate-pulse">LIVE</Badge>
            Espelho em tempo real • Civeni 2025
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            <Database className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button onClick={refresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <StripeFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary?.liquido || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bruto: {formatCurrency(summary?.bruto || 0)}
            </p>
            <p className="text-xs text-red-500">
              Taxas: -{formatCurrency(summary?.taxas || 0)}
            </p>
            {!summary && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Aguardando dados do Stripe...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscrições Pagas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pagos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Não pagas: {summary?.naoPagos || 0}
            </p>
            <p className="text-xs text-green-600 font-medium">
              Conversão: {summary?.taxaConversao || '0.00'}%
            </p>
            {summary && summary.pagos === 0 && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Nenhum pagamento confirmado ainda
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.ticketMedio || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Por transação confirmada
            </p>
            {summary && summary.pagos > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em {summary.pagos} {summary.pagos === 1 ? 'transação' : 'transações'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas & Disputas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary?.disputas || 0}</div>
            <p className="text-xs text-muted-foreground">
              Reembolsos: {summary?.reembolsos || 0}
            </p>
            <p className="text-xs text-red-500">
              Falhas: {summary?.falhas || 0}
            </p>
            {summary && (summary.disputas > 0 || summary.falhas > 0) && (
              <p className="text-xs text-orange-500 mt-1 font-medium">
                ⚠️ Requer atenção
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximo Payout */}
      {summary?.proximoPayout && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximo Payout</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.proximoPayout.valor)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Data prevista</p>
                <p className="text-lg font-medium">
                  {new Date(summary.proximoPayout.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart data={timeseries} loading={loading} />
        <BrandChart data={byBrand} loading={loading} />
      </div>

      <FunnelChart data={funnel} loading={loading} />

      {/* Tabs */}
      <Tabs defaultValue="tabela">
        <TabsList>
          <TabsTrigger value="tabela">Transações Detalhadas</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transações Detalhadas</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportTransacoesPDF} disabled={loading} size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={handleExportTransacoesExcel} disabled={loading} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ChargesTable data={charges} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Clientes</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportClientesPDF} disabled={loading} size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={handleExportClientesExcel} disabled={loading} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando clientes...</p>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left p-3 font-medium">Nome</th>
                        <th className="text-left p-3 font-medium">E-mail</th>
                        <th className="text-left p-3 font-medium">Forma de pagamento padrão</th>
                        <th className="text-left p-3 font-medium">Criado</th>
                        <th className="text-right p-3 font-medium">Total gasto</th>
                        <th className="text-center p-3 font-medium">Pagamentos</th>
                        <th className="text-right p-3 font-medium">Reembolsos</th>
                        <th className="text-center p-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer: any) => (
                        <tr key={customer.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-medium">{customer.nome}</div>
                            <div className="text-xs text-muted-foreground">Convidado</div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            <a 
                              href={customer.stripe_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-primary hover:underline"
                            >
                              {customer.email}
                            </a>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {customer.card_brand && (
                                <>
                                  <CreditCard className="h-4 w-4" />
                                  <span className="font-medium">{customer.card_brand}</span>
                                  {customer.last4 && (
                                    <span className="text-muted-foreground">•••• {customer.last4}</span>
                                  )}
                                </>
                              )}
                              {!customer.card_brand && (
                                <span className="text-muted-foreground">Não definida</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{customer.criado}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(customer.total_gasto)}
                          </td>
                          <td className="p-3 text-center">{customer.pagamentos}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(customer.reembolsos_valor || 0)}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.email)}
                              disabled={deletingCustomer === customer.email}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              {deletingCustomer === customer.email ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analises">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Análises Avançadas</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportAnalisesPDF} disabled={loading} size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={handleExportAnalisesExcel} disabled={loading} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Resumo Financeiro</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Receita Bruta</p>
                      <p className="text-xl font-bold">{formatCurrency(summary?.bruto || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Taxas</p>
                      <p className="text-xl font-bold text-red-500">-{formatCurrency(summary?.taxas || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Receita Líquida</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(summary?.liquido || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                      <p className="text-xl font-bold">{formatCurrency(summary?.ticketMedio || 0)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Análise por Bandeira</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Bandeira</th>
                          <th className="text-right p-2">Transações</th>
                          <th className="text-right p-2">Valor Total</th>
                          <th className="text-right p-2">Percentual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byBrand.map((brand: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-medium">{brand.brand?.toUpperCase() || '-'}</td>
                            <td className="p-2 text-right">{brand.count || 0}</td>
                            <td className="p-2 text-right">{formatCurrency((brand.amount || 0) / 100)}</td>
                            <td className="p-2 text-right">{charges.length > 0 ? ((brand.count / charges.length) * 100).toFixed(1) : 0}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {funnel && funnel.steps && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Funil de Conversão</h3>
                    <div className="space-y-2">
                      {funnel.steps.map((step: any, index: number) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{step.name}</span>
                              <span className="text-sm text-muted-foreground">{step.count} ({step.percentage?.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all" 
                                style={{ width: `${step.percentage || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Taxa de Conversão Total: {funnel.conversionRate?.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
