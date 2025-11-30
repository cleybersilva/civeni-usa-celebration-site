
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStripeDashboard } from '@/hooks/useStripeDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, CreditCard, DollarSign, Users, AlertTriangle, Download, Database, Trash2, FileText, Wallet } from 'lucide-react';
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
  const [syncing, setSyncing] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null);
  const [timeseriesPage, setTimeseriesPage] = useState(1);
  const [allTimeseriesData, setAllTimeseriesData] = useState<any[]>([]);
  const [loadingAllTimeseries, setLoadingAllTimeseries] = useState(false);
  const [totalPayoutsData, setTotalPayoutsData] = useState<{ total: number; count: number } | null>(null);
  const ITEMS_PER_PAGE = 10;

  const [filters, setFilters] = useState({
    range: 'all',
    status: 'all',
    lote: '',
    cupom: '',
    brand: 'all',
    customFrom: undefined,
    customTo: undefined,
    chargesOffset: 0,
    customersOffset: 0,
    chargesSearch: '',
    customersSearch: '',
    customersCurso: '',
    customersTurma: '',
    customersStatus: '',
    customersPaymentMethod: '',
    customersStartDate: '',
    customersEndDate: ''
  });

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
  } = useStripeDashboard(filters);

  // Função reutilizável para buscar timeseries usando edge function (sem RLS)
  const fetchAllTimeseries = useCallback(async () => {
    setLoadingAllTimeseries(true);
    try {
      // Usar edge function para evitar problemas de RLS
      const { data, error } = await supabase.functions.invoke('finance-timeseries', {
        method: 'GET'
      });

      if (error) {
        console.error('Erro ao buscar timeseries:', error);
        setAllTimeseriesData([]);
        return;
      }

      if (!data || !data.data || data.data.length === 0) {
        setAllTimeseriesData([]);
        return;
      }

      // Converter formato da edge function para o formato esperado pelo componente
      const timeseriesData = data.data.map((item: any) => ({
        dia: item.dia,
        receita_bruta: item.receita_bruta,
        receita_liquida: item.receita_liquida,
        taxas: item.taxas,
        transacoes: item.transacoes
      })).sort((a: any, b: any) => b.dia.localeCompare(a.dia));
      
      setAllTimeseriesData(timeseriesData);
    } catch (err) {
      console.error('Exceção:', err);
      setAllTimeseriesData([]);
    } finally {
      setLoadingAllTimeseries(false);
    }
  }, []);

  // Buscar TODOS os dados históricos de receitas para a seção Tendências Temporais
  useEffect(() => {
    fetchAllTimeseries();
  }, [fetchAllTimeseries]);

  // Função para buscar total de payouts depositados na conta
  const fetchTotalPayouts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_payouts')
        .select('amount')
        .eq('status', 'paid');

      if (error) {
        console.error('Erro ao buscar payouts:', error);
        return;
      }

      if (data && data.length > 0) {
        const totalCents = data.reduce((sum, payout) => sum + (payout.amount || 0), 0);
        setTotalPayoutsData({ 
          total: totalCents / 100, 
          count: data.length 
        });
      } else {
        setTotalPayoutsData({ total: 0, count: 0 });
      }
    } catch (err) {
      console.error('Erro ao buscar payouts:', err);
    }
  }, []);

  // Buscar total de payouts depositados
  useEffect(() => {
    fetchTotalPayouts();
    
    // Realtime subscription para atualizar em tempo real
    const channel = supabase
      .channel('stripe_payouts_revenue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stripe_payouts' }, () => {
        fetchTotalPayouts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTotalPayouts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      range: 'all',
      status: 'all',
      lote: '',
      cupom: '',
      brand: 'all',
      customFrom: undefined,
      customTo: undefined,
      chargesOffset: 0,
      customersOffset: 0,
      chargesSearch: '',
      customersSearch: '',
      customersCurso: '',
      customersTurma: '',
      customersStatus: '',
      customersPaymentMethod: '',
      customersStartDate: '',
      customersEndDate: ''
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

      // Atualizar TODOS os dados após sync
      await Promise.all([
        refresh(),
        fetchAllTimeseries(),
        fetchTotalPayouts()
      ]);
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

  const handleExportAnalysisPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(219, 39, 119);
      doc.text('Relatorio de Analises Avancadas - CIVENI 2025', 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      let periodo = '';
      if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
        periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
      } else {
        const days = parseInt(filters.range) || 30;
        periodo = `Ultimos ${days} dias`;
      }
      doc.text(`Periodo: ${periodo} | Data de Geracao: ${new Date().toLocaleString('pt-BR')}`, 105, yPos, { align: 'center' });
      yPos += 15;
      
      // Resumo Executivo - Cards
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Resumo Executivo', 14, yPos);
      yPos += 8;
      
      const resumoData = [
        ['Taxa de Conversao', `${summary?.taxaConversao ? Number(summary.taxaConversao).toFixed(1) : '0'}%`, `${summary?.pagos || 0} pagos de ${(summary?.pagos || 0) + (summary?.naoPagos || 0)} total`],
        ['Ticket Medio', formatCurrency(summary?.ticketMedio || 0), 'Por transacao paga'],
        ['Receita Total', formatCurrency(summary?.liquido || 0), 'Liquido apos taxas'],
        ['Receita Bruta', formatCurrency(summary?.bruto || 0), 'Total antes das taxas'],
        ['Taxas Stripe', formatCurrency(summary?.taxas || 0), 'Total de taxas cobradas'],
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Metrica', 'Valor', 'Descricao']],
        body: resumoData,
        theme: 'grid',
        headStyles: { fillColor: [219, 39, 119] },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Análise por Bandeira
      doc.setFontSize(14);
      doc.text('Analise por Bandeira de Cartao', 14, yPos);
      yPos += 8;
      
      const bandeiraData = byBrand && byBrand.length > 0 
        ? byBrand.map(brand => {
            const percentage = summary?.bruto && summary.bruto > 0 
              ? (((brand.receita_bruta || 0) / summary.bruto) * 100).toFixed(1)
              : '0';
            return [
              `${brand.bandeira || 'Nao especificado'} ${brand.funding ? `(${brand.funding})` : ''}`,
              `${brand.qtd || 0}`,
              formatCurrency(brand.receita_liquida || 0),
              formatCurrency(brand.receita_bruta || 0),
              `${percentage}%`
            ];
          })
        : [['Nenhum dado disponivel', '', '', '', '']];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Bandeira', 'Qtd', 'Receita Liquida', 'Receita Bruta', '% do Total']],
        body: bandeiraData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Tendências Temporais - Usar todos os dados históricos disponíveis
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.text('Tendencias Temporais - Historico Completo', 14, yPos);
      yPos += 8;
      
      // Usar os dados de timeseries ou allTimeseriesData, o que tiver dados
      const dataParaTendencias = (allTimeseriesData && allTimeseriesData.length > 0) 
        ? allTimeseriesData 
        : (timeseries && timeseries.length > 0) 
          ? timeseries 
          : [];
      
      const tendenciasData = dataParaTendencias.length > 0
        ? dataParaTendencias.map(item => {
            const dateValue = item.dia || item.date;
            const receita = item.receita_liquida || item.liquido || 0;
            const transacoes = item.transacoes || item.count || 0;
            const ticketMedio = transacoes > 0 ? receita / transacoes : 0;
            return [
              dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : '-',
              formatCurrency(receita),
              `${transacoes}`,
              formatCurrency(ticketMedio)
            ];
          })
        : [['Nenhum dado temporal disponivel', '', '', '']];
      
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Receita', 'Transacoes', 'Ticket Medio']],
        body: tendenciasData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });
      
      // Save PDF
      doc.save(`analise-avancada-civeni-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF exportado com sucesso!",
        description: "O relatorio de analises foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: "Nao foi possivel gerar o relatorio PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportAnalysisXLSX = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      let periodo = '';
      if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
        periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
      } else {
        const days = parseInt(filters.range) || 30;
        periodo = `Ultimos ${days} dias`;
      }
      
      // Sheet 1: Resumo Executivo
      const resumoData = [
        ['Relatorio de Analises Avancadas - CIVENI 2025'],
        [''],
        [`Periodo: ${periodo}`],
        [`Data de Geracao: ${new Date().toLocaleString('pt-BR')}`],
        [''],
        ['=== RESUMO EXECUTIVO ==='],
        [''],
        ['Metrica', 'Valor', 'Descricao'],
        ['Taxa de Conversao', `${summary?.taxaConversao ? Number(summary.taxaConversao).toFixed(1) : '0'}%`, `${summary?.pagos || 0} pagos de ${(summary?.pagos || 0) + (summary?.naoPagos || 0)} total`],
        ['Ticket Medio', formatCurrency(summary?.ticketMedio || 0), 'Por transacao paga'],
        ['Receita Liquida', formatCurrency(summary?.liquido || 0), 'Liquido apos taxas'],
        ['Receita Bruta', formatCurrency(summary?.bruto || 0), 'Total antes das taxas'],
        ['Taxas Stripe', formatCurrency(summary?.taxas || 0), 'Total de taxas cobradas'],
        ['Pagamentos Concluidos', summary?.pagos || 0, 'Transacoes bem-sucedidas'],
        ['Pagamentos Pendentes', summary?.naoPagos || 0, 'Aguardando confirmacao'],
        ['Falhas de Pagamento', summary?.falhas || 0, 'Transacoes com erro'],
        ['Reembolsos', summary?.reembolsos || 0, 'Total de reembolsos'],
        ['Disputas', summary?.disputas || 0, 'Disputas abertas'],
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo');
      
      // Sheet 2: Análise por Bandeira
      const bandeiraData = [
        ['Analise por Bandeira de Cartao'],
        [''],
        [`Periodo: ${periodo}`],
        [''],
        ['Bandeira', 'Funding', 'Quantidade', 'Receita Liquida', 'Receita Bruta', '% do Total']
      ];
      
      if (byBrand && byBrand.length > 0) {
        byBrand.forEach(brand => {
          const percentage = summary?.bruto && summary.bruto > 0 
            ? (((brand.receita_bruta || 0) / summary.bruto) * 100).toFixed(1)
            : '0';
          bandeiraData.push([
            brand.bandeira || 'Nao especificado',
            brand.funding || '-',
            brand.qtd || 0,
            brand.receita_liquida || 0,
            brand.receita_bruta || 0,
            `${percentage}%`
          ]);
        });
      } else {
        bandeiraData.push(['Nenhum dado disponivel', '', '', '', '', '']);
      }
      
      const wsBandeira = XLSX.utils.aoa_to_sheet(bandeiraData);
      XLSX.utils.book_append_sheet(wb, wsBandeira, 'Analise por Bandeira');
      
      // Sheet 3: Tendências Temporais - Usar histórico completo
      const tendenciasData = [
        ['Tendencias Temporais - Historico Completo'],
        [''],
        ['Data', 'Receita Liquida', 'Receita Bruta', 'Taxas', 'Transacoes', 'Ticket Medio']
      ];
      
      // Usar os dados de timeseries ou allTimeseriesData, o que tiver dados
      const dataParaTendencias = (allTimeseriesData && allTimeseriesData.length > 0) 
        ? allTimeseriesData 
        : (timeseries && timeseries.length > 0) 
          ? timeseries 
          : [];
      
      if (dataParaTendencias.length > 0) {
        dataParaTendencias.forEach(item => {
          const dateValue = item.dia || item.date;
          const receita = item.receita_liquida || item.liquido || 0;
          const receitaBruta = item.receita_bruta || item.bruto || 0;
          const taxas = item.taxas || item.fees || 0;
          const transacoes = item.transacoes || item.count || 0;
          const ticketMedio = transacoes > 0 ? receita / transacoes : 0;
          tendenciasData.push([
            dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : '-',
            receita,
            receitaBruta,
            taxas,
            transacoes,
            ticketMedio
          ]);
        });
      } else {
        tendenciasData.push(['Nenhum dado temporal disponivel', '', '', '', '', '']);
      }
      
      const wsTendencias = XLSX.utils.aoa_to_sheet(tendenciasData);
      XLSX.utils.book_append_sheet(wb, wsTendencias, 'Tendencias Temporais');
      
      // Save XLSX
      XLSX.writeFile(wb, `analise-avancada-civeni-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Excel exportado com sucesso!",
        description: "O relatorio de analises foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar XLSX:', error);
      toast({
        title: "Erro ao exportar",
        description: "Nao foi possivel gerar o relatorio Excel.",
        variant: "destructive",
      });
    }
  };

  const handleExportAnalysisCSV = () => {
    try {
      const csvRows: string[] = [];
      
      let periodo = '';
      if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
        periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
      } else {
        const days = parseInt(filters.range) || 30;
        periodo = `Ultimos ${days} dias`;
      }
      
      // Header
      csvRows.push('=== RELATORIO DE ANALISES AVANCADAS - CIVENI 2025 ===');
      csvRows.push(`Periodo: ${periodo}`);
      csvRows.push(`Data de Geracao: ${new Date().toLocaleString('pt-BR')}`);
      csvRows.push('');
      
      // Resumo Executivo
      csvRows.push('=== RESUMO EXECUTIVO ===');
      csvRows.push('Metrica,Valor');
      csvRows.push(`Receita Bruta,${summary?.bruto || 0}`);
      csvRows.push(`Taxas Stripe,${summary?.taxas || 0}`);
      csvRows.push(`Receita Liquida,${summary?.liquido || 0}`);
      csvRows.push(`Pagamentos Concluidos,${summary?.pagos || 0}`);
      csvRows.push(`Pagamentos Pendentes,${summary?.naoPagos || 0}`);
      csvRows.push(`Falhas de Pagamento,${summary?.falhas || 0}`);
      csvRows.push(`Reembolsos,${summary?.reembolsos || 0}`);
      csvRows.push(`Disputas,${summary?.disputas || 0}`);
      csvRows.push(`Ticket Medio,${summary?.ticketMedio || 0}`);
      csvRows.push(`Taxa de Conversao,${summary?.taxaConversao ? Number(summary.taxaConversao).toFixed(2) : 0}%`);
      csvRows.push('');
      
      // Análise por Bandeira
      csvRows.push('=== ANALISE POR BANDEIRA DE CARTAO ===');
      csvRows.push('Bandeira,Funding,Quantidade,Receita Liquida,Receita Bruta,% do Total');
      if (byBrand && byBrand.length > 0) {
        const totalReceita = summary?.bruto || 1;
        byBrand.forEach(brand => {
          const percentage = (((brand.receita_bruta || 0) / totalReceita) * 100).toFixed(2);
          csvRows.push(`${brand.bandeira || 'Nao especificado'},${brand.funding || '-'},${brand.qtd || 0},${brand.receita_liquida || 0},${brand.receita_bruta || 0},${percentage}%`);
        });
      }
      csvRows.push('');
      
      // Análise Temporal - Usar histórico completo
      csvRows.push('=== ANALISE DE TENDENCIAS TEMPORAIS - HISTORICO COMPLETO ===');
      csvRows.push('Data,Receita Liquida,Receita Bruta,Taxas,Quantidade de Transacoes,Ticket Medio');
      
      // Usar os dados de timeseries ou allTimeseriesData, o que tiver dados
      const dataParaTendencias = (allTimeseriesData && allTimeseriesData.length > 0) 
        ? allTimeseriesData 
        : (timeseries && timeseries.length > 0) 
          ? timeseries 
          : [];
      
      if (dataParaTendencias.length > 0) {
        dataParaTendencias.forEach(item => {
          const dateValue = item.dia || item.date;
          const receita = item.receita_liquida || item.liquido || 0;
          const receitaBruta = item.receita_bruta || item.bruto || 0;
          const taxas = item.taxas || item.fees || 0;
          const transacoes = item.transacoes || item.count || 0;
          const ticketMedio = transacoes > 0 ? receita / transacoes : 0;
          csvRows.push(`${dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : '-'},${receita},${receitaBruta},${taxas},${transacoes},${ticketMedio}`);
        });
      } else {
        csvRows.push('Nenhum dado temporal disponivel,0,0,0,0,0');
      }
      csvRows.push('');
      
      // Análise de Funil
      csvRows.push('=== ANALISE DE FUNIL DE CONVERSAO ===');
      csvRows.push('Estagio,Quantidade,Valor Total');
      if (funnel && funnel.length > 0) {
        funnel.forEach(stage => {
          csvRows.push(`${stage.estagio},${stage.quantidade},${stage.valor}`);
        });
      }
      csvRows.push('');
      
      // Transações Detalhadas
      csvRows.push('=== TRANSACOES DETALHADAS ===');
      csvRows.push('ID,Data,Cliente,Email,Valor,Status,Metodo,Bandeira,Descricao');
      if (charges && charges.length > 0) {
        charges.forEach(charge => {
          const row = [
            charge.id || '',
            new Date(charge.created * 1000).toLocaleString('pt-BR'),
            (charge.customer?.nome || 'N/A').replace(/,/g, ';'),
            charge.customer?.email || 'N/A',
            charge.amount / 100,
            charge.status || 'N/A',
            charge.payment_method_type || 'N/A',
            charge.brand || 'N/A',
            (charge.description || '').replace(/,/g, ';')
          ].join(',');
          csvRows.push(row);
        });
      }
      csvRows.push('');
      
      // Participantes
      csvRows.push('=== ANALISE DE PARTICIPANTES ===');
      csvRows.push('Nome,Email,Curso,Turma,Valor Pago,Status,Metodo de Pagamento,Data de Registro');
      if (customers && customers.length > 0) {
        customers.forEach(customer => {
          const row = [
            (customer.nome || 'N/A').replace(/,/g, ';'),
            customer.email || 'N/A',
            (customer.curso || 'N/A').replace(/,/g, ';'),
            customer.turma || 'N/A',
            customer.valor_pago || 0,
            customer.status || 'N/A',
            customer.metodo_pagamento || 'N/A',
            customer.data_registro ? new Date(customer.data_registro).toLocaleDateString('pt-BR') : 'N/A'
          ].join(',');
          csvRows.push(row);
        });
      }
      csvRows.push('');
      
      // Insights e Recomendações
      csvRows.push('=== INSIGHTS E RECOMENDACOES ===');
      
      const taxaFalha = summary && summary.pagos > 0 
        ? ((summary.falhas / (summary.pagos + summary.falhas)) * 100).toFixed(2)
        : '0';
      
      csvRows.push(`Taxa de Falha: ${taxaFalha}%`);
      
      if (parseFloat(taxaFalha) > 10) {
        csvRows.push('ATENCAO: Taxa de falha acima de 10% - Investigar possiveis problemas de checkout');
      }
      
      if (summary && summary.disputas > 0) {
        csvRows.push(`ATENCAO: ${summary.disputas} disputas abertas - Requer acao imediata`);
      }
      
      if (byBrand && byBrand.length > 0) {
        const topBrand = byBrand[0];
        csvRows.push(`Bandeira principal: ${topBrand.bandeira} (${(((topBrand.receita_bruta || 0) / (summary?.bruto || 1)) * 100).toFixed(1)}% da receita)`);
      }
      
      if (summary && summary.ticketMedio) {
        csvRows.push(`Ticket medio: ${summary.ticketMedio}`);
      }
      
      csvRows.push('');
      csvRows.push('=== FIM DO RELATORIO ===');
      
      // Criar e baixar CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `analise-avancada-civeni-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Relatorio exportado com sucesso!",
        description: "O relatorio de analises foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao exportar analises:', error);
      toast({
        title: "Erro ao exportar",
        description: "Nao foi possivel gerar o relatorio de analises.",
        variant: "destructive",
      });
    }
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
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden px-1">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 text-center md:text-left">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight break-words">Dashboard Financeiro Stripe</h2>
          <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center justify-center md:justify-start gap-1 sm:gap-2 mt-1">
            <Badge variant="secondary" className="animate-pulse text-[10px] sm:text-xs">LIVE</Badge>
            <span className="break-words">Espelho em tempo real • Civeni 2025</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto md:mx-0 md:max-w-none md:flex md:flex-wrap">
          <Button 
            onClick={handleExportPDF} 
            disabled={loading} 
            size="sm"
            className="text-white border-0 text-xs sm:text-sm px-3 sm:px-4"
            style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b)' }}
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
            PDF
          </Button>
          <Button 
            onClick={handleExportExcel} 
            disabled={loading} 
            size="sm"
            className="text-white border-0 text-xs sm:text-sm px-3 sm:px-4"
            style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b)' }}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0" />
            Excel
          </Button>
          <Button 
            onClick={handleSync} 
            disabled={syncing} 
            size="sm"
            className="text-white border-0 text-xs sm:text-sm px-3 sm:px-4"
            style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b)' }}
          >
            <Database className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button 
            onClick={refresh} 
            disabled={loading} 
            size="sm"
            className="text-white border-0 text-xs sm:text-sm px-3 sm:px-4"
            style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b)' }}
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 shrink-0 ${loading ? 'animate-spin' : ''}`} />
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card Receita Líquida */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Receita Líquida</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary?.liquido || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Bruto: {formatCurrency(summary?.bruto || 0)}
            </p>
            <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400">
              Taxas: -{formatCurrency(summary?.taxas || 0)}
            </p>
            {!summary && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 italic">
                Aguardando dados do Stripe...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card Receita Recebida Inter - Total de Payouts depositados */}
        <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Receita Recebida Inter</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">
              {formatCurrency(totalPayoutsData?.total || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              Depositado na conta bancária
            </p>
            <p className="text-[10px] sm:text-xs text-cyan-600 dark:text-cyan-400 font-medium mt-1">
              {totalPayoutsData?.count || 0} transferências realizadas
            </p>
          </CardContent>
        </Card>

        {/* Card Inscrições Pagas */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Inscrições Pagas</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.pagos || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Não pagas: {summary?.naoPagos || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">
              Conversão: {summary?.taxaConversao || '0.00'}%
            </p>
            {summary && summary.pagos === 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 italic">
                Nenhum pagamento confirmado ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card Ticket Médio */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Ticket Médio</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(summary?.ticketMedio || 0)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Por transação confirmada
            </p>
            {summary && summary.pagos > 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Baseado em {summary.pagos} {summary.pagos === 1 ? 'transação' : 'transações'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card Alertas & Disputas */}
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Alertas & Disputas</CardTitle>
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{summary?.disputas || 0}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Reembolsos: {summary?.reembolsos || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-red-500 dark:text-red-400">
              Falhas: {summary?.falhas || 0}
            </p>
            {summary && (summary.disputas > 0 || summary.falhas > 0) && (
              <p className="text-[10px] sm:text-xs text-orange-500 dark:text-orange-400 mt-1 font-medium">
                ⚠️ Requer atenção
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximo Payout */}
      {summary?.proximoPayout && (
        <Card className={`border-l-4 ${summary.proximoPayout.isLastPaid ? 'border-l-blue-500 bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50 dark:from-blue-950/30 dark:via-sky-950/30 dark:to-cyan-950/30' : 'border-l-emerald-500 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30'} shadow-lg`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${summary.proximoPayout.isLastPaid ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300'} font-medium`}>
                  {summary.proximoPayout.isLastPaid ? '✅ Último Payout Realizado' : '🔄 Próximo Payout'}
                </p>
                <p className={`text-3xl font-bold ${summary.proximoPayout.isLastPaid ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'} mt-1`}>
                  {formatCurrency(summary.proximoPayout.valor)}
                </p>
                {/* Aviso se dados parecem desatualizados */}
                {new Date(summary.proximoPayout.data) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ Dados podem estar desatualizados - Execute "Sincronizar Stripe"
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-sm ${summary.proximoPayout.isLastPaid ? 'text-blue-700 dark:text-blue-300' : 'text-emerald-700 dark:text-emerald-300'} font-medium`}>
                  {summary.proximoPayout.isLastPaid ? 'Depositado em' : 'Data prevista'}
                </p>
                <p className={`text-xl font-bold ${summary.proximoPayout.isLastPaid ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'} mt-1`}>
                  {new Date(summary.proximoPayout.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <RevenueChart data={timeseries} loading={loading} />
        <BrandChart data={byBrand} loading={loading} />
      </div>

      <FunnelChart data={funnel} loading={loading} />

      {/* Tabs */}
      <Tabs defaultValue="tabela">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 h-auto p-1">
          <TabsTrigger value="tabela" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3">
            <span className="hidden sm:inline">Transações Detalhadas</span>
            <span className="sm:hidden">Transações</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3">Participantes</TabsTrigger>
          <TabsTrigger value="analises" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-[10px] sm:text-xs md:text-sm py-2 px-1 sm:px-3">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <ChargesTable 
            data={charges} 
            loading={loading} 
            pagination={chargesPagination}
            onPageChange={(offset) => {
              setFilters(prev => ({ ...prev, chargesOffset: offset }));
            }}
            searchValue={filters.chargesSearch}
            onSearchChange={(search) => {
              setFilters(prev => ({ ...prev, chargesSearch: search, chargesOffset: 0 }));
            }}
          />
        </TabsContent>

        <TabsContent value="customers">
          <ParticipantsTable
            data={customers}
            loading={loading}
            pagination={customersPagination}
            onPageChange={(offset) => {
              setFilters(prev => ({ ...prev, customersOffset: offset }));
            }}
            onDelete={handleDeleteCustomer}
            deletingCustomer={deletingCustomer}
            searchValue={filters.customersSearch}
            onSearchChange={(search) => {
              setFilters(prev => ({ ...prev, customersSearch: search, customersOffset: 0 }));
            }}
            cursoFilter={filters.customersCurso}
            onCursoFilterChange={(cursoId) => {
              setFilters(prev => ({ ...prev, customersCurso: cursoId, customersTurma: '', customersOffset: 0 }));
            }}
            turmaFilter={filters.customersTurma}
            onTurmaFilterChange={(turmaId) => {
              setFilters(prev => ({ ...prev, customersTurma: turmaId, customersOffset: 0 }));
            }}
            statusFilter={filters.customersStatus}
            onStatusFilterChange={(status) => {
              setFilters(prev => ({ ...prev, customersStatus: status, customersOffset: 0 }));
            }}
            paymentMethodFilter={filters.customersPaymentMethod}
            onPaymentMethodFilterChange={(method) => {
              setFilters(prev => ({ ...prev, customersPaymentMethod: method, customersOffset: 0 }));
            }}
            startDate={filters.customersStartDate}
            endDate={filters.customersEndDate}
            onStartDateChange={(date) => {
              setFilters(prev => ({ ...prev, customersStartDate: date, customersOffset: 0 }));
            }}
            onEndDateChange={(date) => {
              setFilters(prev => ({ ...prev, customersEndDate: date, customersOffset: 0 }));
            }}
          />
        </TabsContent>

        <TabsContent value="analises">
          <div className="space-y-6">
            {/* Insights Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-l-4 border-l-pink-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {summary?.taxaConversao ? `${Number(summary.taxaConversao).toFixed(1)}%` : '0%'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.pagos || 0} pagos de {(summary?.pagos || 0) + (summary?.naoPagos || 0)} total
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(summary?.ticketMedio || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por transação paga
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(summary?.liquido || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Líquido após taxas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Análise por Bandeira */}
            <Card className="border-t-4 border-t-indigo-500">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20">
                <CardTitle className="text-indigo-700 dark:text-indigo-300">Análise por Bandeira de Cartão</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {byBrand && byBrand.length > 0 ? (
                    byBrand.map((brand, idx) => (
                      <div key={`${brand.bandeira}-${brand.funding}-${idx}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{(brand.bandeira || 'NN').substring(0, 2).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium capitalize">{brand.bandeira || 'Não especificado'} {brand.funding ? `(${brand.funding})` : ''}</p>
                            <p className="text-xs text-muted-foreground">{brand.qtd || 0} transações</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(brand.receita_liquida || 0)}</p>
                          <p className="text-xs text-muted-foreground">
                            {summary?.bruto && summary.bruto > 0 
                              ? `${(((brand.receita_bruta || 0) / summary.bruto) * 100).toFixed(1)}% do total`
                              : '0% do total'
                            }
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Análise de Tendências */}
            <Card className="border-t-4 border-t-emerald-500">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                <CardTitle className="text-emerald-700 dark:text-emerald-300">Tendências Temporais - Histórico Completo</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingAllTimeseries ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando dados históricos...</div>
                ) : allTimeseriesData && allTimeseriesData.length > 0 ? (
                  (() => {
                    const totalPages = Math.ceil(allTimeseriesData.length / ITEMS_PER_PAGE);
                    const startIndex = (timeseriesPage - 1) * ITEMS_PER_PAGE;
                    const endIndex = startIndex + ITEMS_PER_PAGE;
                    const currentData = allTimeseriesData.slice(startIndex, endIndex);
                    
                    const getPageNumbers = () => {
                      const pages = [];
                      const maxPagesToShow = 5;
                      
                      if (totalPages <= maxPagesToShow) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        if (timeseriesPage <= 3) {
                          for (let i = 1; i <= 4; i++) pages.push(i);
                          pages.push('...');
                          pages.push(totalPages);
                        } else if (timeseriesPage >= totalPages - 2) {
                          pages.push(1);
                          pages.push('...');
                          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
                        } else {
                          pages.push(1);
                          pages.push('...');
                          pages.push(timeseriesPage - 1);
                          pages.push(timeseriesPage);
                          pages.push(timeseriesPage + 1);
                          pages.push('...');
                          pages.push(totalPages);
                        }
                      }
                      
                      return pages;
                    };
                    
                    return (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-muted-foreground pb-2 border-b">
                            <div>Data</div>
                            <div className="text-right">Receita</div>
                            <div className="text-right">Transações</div>
                            <div className="text-right">Ticket Médio</div>
                          </div>
                          {currentData.map((item, idx) => {
                            const dateValue = item.dia;
                            const receita = item.receita_liquida || 0;
                            const transacoes = item.transacoes || 0;
                            const ticketMedio = transacoes > 0 ? receita / transacoes : 0;
                            
                            return (
                              <div key={idx} className="grid grid-cols-4 gap-2 text-sm py-2 hover:bg-muted/50 rounded">
                                <div>
                                  {dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : '-'}
                                </div>
                                <div className="text-right font-medium">{formatCurrency(receita)}</div>
                                <div className="text-right">{transacoes}</div>
                                <div className="text-right text-muted-foreground">
                                  {formatCurrency(ticketMedio)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Mostrando {startIndex + 1} a {Math.min(endIndex, allTimeseriesData.length)} de {allTimeseriesData.length} registros
                            </div>
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => {
                                      if (timeseriesPage > 1) {
                                        setTimeseriesPage(timeseriesPage - 1);
                                      }
                                    }}
                                    className={timeseriesPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>
                                
                                {getPageNumbers().map((page, index) => (
                                  <PaginationItem key={index}>
                                    {page === '...' ? (
                                      <span className="px-4">...</span>
                                    ) : (
                                      <PaginationLink
                                        onClick={() => setTimeseriesPage(page as number)}
                                        isActive={timeseriesPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    )}
                                  </PaginationItem>
                                ))}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => {
                                      if (timeseriesPage < totalPages) {
                                        setTimeseriesPage(timeseriesPage + 1);
                                      }
                                    }}
                                    className={timeseriesPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado temporal disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Exportação */}
            <Card className="border-t-4 border-t-pink-500">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
                <CardTitle className="text-pink-700 dark:text-pink-300">Exportar Análises</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Exporte um relatório completo com todas as análises, tendências e insights detalhados das transações.
                </p>
                <div className="grid gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/30"
                    onClick={handleExportAnalysisPDF}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar Relatório (PDF)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-green-300 hover:bg-green-50 dark:border-green-700 dark:hover:bg-green-950/30"
                    onClick={handleExportAnalysisXLSX}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório (XLSX)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-pink-300 hover:bg-pink-50 dark:border-pink-700 dark:hover:bg-pink-950/30"
                    onClick={handleExportAnalysisCSV}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório (CSV)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
