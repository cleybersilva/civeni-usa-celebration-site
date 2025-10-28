
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
    if (!confirm(`Tem certeza que deseja excluir TODOS os registros duplicados de ${email}?\n\nEsta ação é irreversível!`)) {
      return;
    }

    setDeletingCustomer(email);
    try {
      console.log('🗑️ Tentando excluir registros duplicados de:', email);
      
      // Chamar a Edge Function para fazer a exclusão com service role
      const { data, error } = await supabase.functions.invoke('delete-customer-registrations', {
        body: { email }
      });

      console.log('🗑️ Resultado da exclusão:', { data, error });

      if (error) {
        console.error('❌ Erro na exclusão:', error);
        throw new Error(error.message || 'Erro ao chamar função de exclusão');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Erro ao excluir registros - resposta inválida');
      }

      toast({
        title: "✅ Registros Duplicados Excluídos!",
        description: `${data.deleted_count} registro(s) duplicado(s) de ${email} foram removidos com sucesso`,
      });

      // Aguardar um pouco antes de atualizar para dar tempo do Supabase processar
      setTimeout(() => {
        refresh();
      }, 1000);
    } catch (error: any) {
      console.error('❌ Delete error completo:', error);
      toast({
        title: "Erro ao excluir registros",
        description: error.message || "Não foi possível excluir os registros duplicados.",
        variant: "destructive"
      });
    } finally {
      setDeletingCustomer(null);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape para mais colunas
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório Financeiro - Civeni 2025', 14, 15);
    
    // Período
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
      doc.text(`Receita Bruta: ${formatCurrency(summary.bruto)} | Líquida: ${formatCurrency(summary.liquido)} | Transações: ${summary.pagos + summary.naoPagos}`, 14, 32);
    }
    
    // Tabela de Transações Detalhadas
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
    
    // Nova página para Clientes
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Relatório de Clientes', 14, 15);
    
    const clientesData = customers.map((customer: any) => [
      customer.email || '-',
      customer.name || '-',
      customer.total_payments || 0,
      formatCurrency(customer.total_spent || 0),
      formatCurrency(customer.total_refunded || 0),
      customer.last_payment_date ? new Date(customer.last_payment_date).toLocaleDateString('pt-BR') : '-',
      customer.payment_methods?.join(', ') || '-'
    ]);
    
    autoTable(doc, {
      head: [['Email', 'Nome', 'Pagamentos', 'Total Gasto', 'Reembolsos', 'Último Pagamento', 'Métodos']],
      body: clientesData,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Nova página para Análises por Bandeira
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Análise por Bandeira', 14, 15);
    
    const bandeirasData = byBrand.map((brand: any) => [
      brand.brand || '-',
      brand.count || 0,
      formatCurrency((brand.amount || 0) / 100),
      `${((brand.count / charges.length) * 100).toFixed(1)}%`
    ]);
    
    autoTable(doc, {
      head: [['Bandeira', 'Transações', 'Valor Total', 'Percentual']],
      body: bandeirasData,
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`relatorio-completo-stripe-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF exportado!",
      description: "O relatório completo foi baixado com sucesso",
    });
  };

  const handleExportParticipantesPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.text('Relatório de Participantes - Civeni 2025', 14, 15);
    
    doc.setFontSize(10);
    let periodo = '';
    if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
      periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
    } else {
      const days = parseInt(filters.range) || 30;
      periodo = `Últimos ${days} dias`;
    }
    doc.text(`Período: ${periodo}`, 14, 25);
    doc.text(`Total de Participantes: ${customers.length}`, 14, 32);
    
    const participantesData = customers.map((customer: any) => [
      customer.nome || '-',
      customer.email || '-',
      customer.card_brand ? `${customer.card_brand} •••• ${customer.last4 || '****'}` : 'Não definida',
      customer.criado || '-',
      formatCurrency(customer.total_gasto || 0),
      customer.pagamentos || 0,
      formatCurrency(customer.reembolsos_valor || 0)
    ]);
    
    autoTable(doc, {
      head: [['Nome', 'E-mail', 'Forma de Pagamento', 'Data de Criação', 'Total Gasto', 'Pagamentos', 'Reembolsos']],
      body: participantesData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 }
      }
    });
    
    doc.save(`participantes-civeni-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF exportado!",
      description: "Relatório de participantes baixado com sucesso",
    });
  };

  const handleExportParticipantesExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const participantesData = customers.map((customer: any) => ({
      'Nome': customer.nome || '-',
      'E-mail': customer.email || '-',
      'Forma de Pagamento': customer.card_brand ? `${customer.card_brand} •••• ${customer.last4 || '****'}` : 'Não definida',
      'Data de Criação': customer.criado || '-',
      'Total Gasto': formatCurrency(customer.total_gasto || 0),
      'Número de Pagamentos': customer.pagamentos || 0,
      'Total Reembolsado': formatCurrency(customer.reembolsos_valor || 0)
    }));
    
    const ws = XLSX.utils.json_to_sheet(participantesData);
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
    
    XLSX.writeFile(wb, `participantes-civeni-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel exportado!",
      description: "Relatório de participantes baixado com sucesso",
    });
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo
    const resumoData = [
      ['Relatório Financeiro - Civeni 2025'],
      [''],
      ['Período', filters.range === 'custom' && filters.customFrom && filters.customTo 
        ? `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`
        : `Últimos ${parseInt(filters.range) || 30} dias`
      ],
      [''],
      ['Receita Bruta', formatCurrency(summary?.bruto || 0)],
      ['Taxas', formatCurrency(summary?.taxas || 0)],
      ['Receita Líquida', formatCurrency(summary?.liquido || 0)],
      ['Pagamentos Confirmados', summary?.pagos || 0],
      ['Pagamentos Pendentes', summary?.naoPagos || 0],
      ['Falhas', summary?.falhas || 0],
      ['Reembolsos', summary?.reembolsos || 0],
      ['Ticket Médio', formatCurrency(summary?.ticketMedio || 0)]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    // Sheet 2: Transações Detalhadas
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
    const wsTransacoes = XLSX.utils.json_to_sheet(transacoesData);
    XLSX.utils.book_append_sheet(wb, wsTransacoes, 'Transações Detalhadas');
    
    // Sheet 3: Clientes
    const clientesData = customers.map((customer: any) => ({
      'Email': customer.email || '-',
      'Nome': customer.name || '-',
      'Total de Pagamentos': customer.total_payments || 0,
      'Total Gasto': formatCurrency(customer.total_spent || 0),
      'Total Reembolsado': formatCurrency(customer.total_refunded || 0),
      'Último Pagamento': customer.last_payment_date ? new Date(customer.last_payment_date).toLocaleDateString('pt-BR') : '-',
      'Métodos de Pagamento': customer.payment_methods?.join(', ') || '-'
    }));
    const wsClientes = XLSX.utils.json_to_sheet(clientesData);
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');
    
    // Sheet 4: Análise por Bandeira
    const brandData = byBrand.map((brand: any) => ({
      'Bandeira': brand.brand?.toUpperCase() || '-',
      'Número de Transações': brand.count || 0,
      'Valor Total': formatCurrency((brand.amount || 0) / 100),
      'Percentual do Total': `${((brand.count / charges.length) * 100).toFixed(2)}%`
    }));
    const wsBrand = XLSX.utils.json_to_sheet(brandData);
    XLSX.utils.book_append_sheet(wb, wsBrand, 'Análise por Bandeira');
    
    XLSX.writeFile(wb, `relatorio-completo-stripe-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel exportado!",
      description: "O relatório completo foi baixado com sucesso",
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
          <Button onClick={handleExportPDF} disabled={loading} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={handleExportExcel} disabled={loading} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
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
          <TabsTrigger value="customers">Participantes</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <ChargesTable data={charges} loading={loading} />
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <CardTitle>Participantes</CardTitle>
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Exclusão de Registros Duplicados</p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Use o botão "Excluir" para remover TODOS os registros duplicados de um cliente específico. 
                      Esta ação é irreversível e requer confirmação.
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando participantes...</p>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum participante encontrado</p>
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
                              title={`Excluir todos os registros duplicados de ${customer.email}`}
                            >
                              {deletingCustomer === customer.email ? (
                                <div className="flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  <span className="text-xs">Excluindo...</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="text-xs">Excluir</span>
                                </div>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Botões de Exportação */}
              {customers.length > 0 && (
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <Button 
                    onClick={handleExportParticipantesPDF} 
                    variant="outline"
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button 
                    onClick={handleExportParticipantesExcel} 
                    variant="outline"
                    disabled={loading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analises">
          <Card>
            <CardHeader>
              <CardTitle>Análises Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Visualize tendências, padrões e insights detalhados das transações.
              </p>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório (CSV)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
