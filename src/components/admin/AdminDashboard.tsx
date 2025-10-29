
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
import { ParticipantsTable } from './stripe/ParticipantsTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Dashboard Stripe - v2.0 - Filtros e Exportação Corrigidos
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
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null);
  const [chargesOffset, setChargesOffset] = useState(0);
  const [customersOffset, setCustomersOffset] = useState(0);
  const [chargesSearch, setChargesSearch] = useState('');
  const [customersSearch, setCustomersSearch] = useState('');

  const { 
    summary, 
    timeseries, 
    byBrand, 
    funnel, 
    charges, 
    customers, 
    chargesPagination,
    customersPagination,
    loading, 
    refresh 
  } = useStripeDashboard({
    ...filters,
    chargesOffset,
    customersOffset,
    chargesSearch,
    customersSearch
  });

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
    console.log('🗑️ Função handleDeleteCustomer chamada para:', email);
    
    if (!confirm(`Tem certeza que deseja excluir TODOS os registros de ${email}?\n\nEsta ação é irreversível!`)) {
      console.log('🚫 Exclusão cancelada pelo usuário');
      return;
    }

    setDeletingCustomer(email);
    
    try {
      console.log('🗑️ Tentando excluir registros duplicados de:', email);
      console.log('📞 Chamando edge function delete-customer-registrations...');
      
      // Chamar a Edge Function para fazer a exclusão com service role
      const { data, error } = await supabase.functions.invoke('delete-customer-registrations', {
        body: { email }
      });

      console.log('📥 Resposta recebida:', { 
        data, 
        error,
        hasData: !!data,
        hasError: !!error,
        dataType: typeof data,
        errorType: typeof error
      });

      if (error) {
        console.error('❌ Erro retornado pela função:', error);
        throw new Error(error.message || 'Erro ao chamar função de exclusão');
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado pela função');
        throw new Error('Função não retornou dados');
      }

      console.log('✅ Dados retornados:', data);

      if (!data.success) {
        console.error('❌ Função retornou success=false:', data.error);
        throw new Error(data.error || 'Erro ao excluir registros');
      }

      console.log(`✅ Sucesso! ${data.deleted_count} registros excluídos`);

      toast({
        title: "✅ Registros Excluídos!",
        description: `${data.deleted_count} registro(s) de ${email} foram removidos com sucesso`,
      });

      // Aguardar um pouco antes de atualizar
      console.log('🔄 Aguardando 1s antes de atualizar lista...');
      setTimeout(() => {
        console.log('🔄 Atualizando lista de participantes...');
        refresh();
      }, 1000);
    } catch (error: any) {
      console.error('❌ Delete error completo:', error);
      console.error('❌ Stack trace:', error.stack);
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
          <Button 
            onClick={handleExportPDF} 
            disabled={loading} 
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button 
            onClick={handleExportExcel} 
            disabled={loading} 
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={syncing} 
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
          >
            <Database className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button 
            onClick={refresh} 
            disabled={loading} 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
          >
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
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary?.liquido || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bruto: {formatCurrency(summary?.bruto || 0)}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400">
              Taxas: -{formatCurrency(summary?.taxas || 0)}
            </p>
            {!summary && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Aguardando dados do Stripe...
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscrições Pagas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.pagos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Não pagas: {summary?.naoPagos || 0}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              Conversão: {summary?.taxaConversao || '0.00'}%
            </p>
            {summary && summary.pagos === 0 && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Nenhum pagamento confirmado ainda
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(summary?.ticketMedio || 0)}</div>
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

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas & Disputas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary?.disputas || 0}</div>
            <p className="text-xs text-muted-foreground">
              Reembolsos: {summary?.reembolsos || 0}
            </p>
            <p className="text-xs text-red-500 dark:text-red-400">
              Falhas: {summary?.falhas || 0}
            </p>
            {summary && (summary.disputas > 0 || summary.falhas > 0) && (
              <p className="text-xs text-orange-500 dark:text-orange-400 mt-1 font-medium">
                ⚠️ Requer atenção
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximo Payout */}
      {summary?.proximoPayout && (
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Próximo Payout</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(summary.proximoPayout.valor)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Data prevista</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
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
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20">
          <TabsTrigger value="tabela" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Transações Detalhadas</TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Participantes</TabsTrigger>
          <TabsTrigger value="analises" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <ChargesTable 
            data={charges} 
            loading={loading} 
            pagination={chargesPagination}
            onPageChange={(offset) => {
              setChargesOffset(offset);
            }}
            searchValue={chargesSearch}
            onSearchChange={(search) => {
              setChargesSearch(search);
              setChargesOffset(0);
            }}
          />
        </TabsContent>

        <TabsContent value="customers">
          <ParticipantsTable
            data={customers}
            loading={loading}
            pagination={customersPagination}
            onPageChange={(offset) => {
              setCustomersOffset(offset);
            }}
            onDelete={handleDeleteCustomer}
            deletingCustomer={deletingCustomer}
            searchValue={customersSearch}
            onSearchChange={(search) => {
              setCustomersSearch(search);
              setCustomersOffset(0);
            }}
          />
        </TabsContent>

        <TabsContent value="analises">
          <Card className="border-t-4 border-t-pink-500">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
              <CardTitle className="text-pink-700 dark:text-pink-300">Análises Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Visualize tendências, padrões e insights detalhados das transações.
              </p>
              <Button variant="outline" className="w-full border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/30">
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
