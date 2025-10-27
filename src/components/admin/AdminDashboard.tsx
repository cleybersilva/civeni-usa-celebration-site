
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

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório Financeiro - Civeni 2025', 14, 20);
    
    // Período
    doc.setFontSize(11);
    let periodo = '';
    if (filters.range === 'custom' && filters.customFrom && filters.customTo) {
      periodo = `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`;
    } else {
      const days = parseInt(filters.range) || 30;
      periodo = `Últimos ${days} dias`;
    }
    doc.text(`Período: ${periodo}`, 14, 28);
    
    // KPIs
    doc.setFontSize(14);
    doc.text('Resumo Executivo', 14, 38);
    
    const kpisData = [
      ['Métrica', 'Valor'],
      ['Receita Bruta', formatCurrency(summary?.bruto || 0)],
      ['Taxas', formatCurrency(summary?.taxas || 0)],
      ['Receita Líquida', formatCurrency(summary?.liquido || 0)],
      ['Inscrições Pagas', `${summary?.pagos || 0}`],
      ['Inscrições Não Pagas', `${summary?.naoPagos || 0}`],
      ['Taxa de Conversão', `${summary?.taxaConversao || '0.00'}%`],
      ['Ticket Médio', formatCurrency(summary?.ticketMedio || 0)],
      ['Reembolsos', `${summary?.reembolsos || 0}`],
      ['Disputas', `${summary?.disputas || 0}`],
      ['Falhas', `${summary?.falhas || 0}`],
    ];
    
    autoTable(doc, {
      startY: 42,
      head: [kpisData[0]],
      body: kpisData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Tabela de Transações
    const finalY = (doc as any).lastAutoTable.finalY || 42;
    doc.setFontSize(14);
    doc.text('Transações', 14, finalY + 10);
    
    const chargesData = charges.slice(0, 20).map((charge: any) => [
      new Date(charge.created).toLocaleDateString('pt-BR'),
      charge.customer_email || 'N/A',
      formatCurrency(charge.amount / 100),
      charge.status === 'succeeded' ? 'Confirmado' : charge.status === 'failed' ? 'Falhou' : 'Processando',
      charge.payment_method_brand || 'N/A',
    ]);
    
    autoTable(doc, {
      startY: finalY + 14,
      head: [['Data', 'Cliente', 'Valor', 'Status', 'Bandeira']],
      body: chargesData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    doc.save(`relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF exportado!",
      description: "O relatório foi baixado com sucesso",
    });
  };

  const handleExportExcel = () => {
    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Resumo
    const summaryData = [
      ['Relatório Financeiro - Civeni 2025'],
      [''],
      ['Período', filters.range === 'custom' && filters.customFrom && filters.customTo 
        ? `${filters.customFrom.toLocaleDateString('pt-BR')} a ${filters.customTo.toLocaleDateString('pt-BR')}`
        : `Últimos ${parseInt(filters.range) || 30} dias`
      ],
      [''],
      ['Métrica', 'Valor'],
      ['Receita Bruta', summary?.bruto || 0],
      ['Taxas', summary?.taxas || 0],
      ['Receita Líquida', summary?.liquido || 0],
      ['Inscrições Pagas', summary?.pagos || 0],
      ['Inscrições Não Pagas', summary?.naoPagos || 0],
      ['Taxa de Conversão', `${summary?.taxaConversao || '0.00'}%`],
      ['Ticket Médio', summary?.ticketMedio || 0],
      ['Reembolsos', summary?.reembolsos || 0],
      ['Disputas', summary?.disputas || 0],
      ['Falhas', summary?.falhas || 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo');
    
    // Sheet 2: Transações
    const chargesData = charges.map((charge: any) => ({
      'Data': new Date(charge.created).toLocaleDateString('pt-BR'),
      'ID': charge.id,
      'Cliente': charge.customer_email || 'N/A',
      'Valor (R$)': (charge.amount / 100).toFixed(2),
      'Status': charge.status === 'succeeded' ? 'Confirmado' : charge.status === 'failed' ? 'Falhou' : 'Processando',
      'Bandeira': charge.payment_method_brand || 'N/A',
      'Últimos 4 dígitos': charge.payment_method_last4 || 'N/A',
      'Descrição': charge.description || 'N/A',
    }));
    const ws2 = XLSX.utils.json_to_sheet(chargesData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Transações');
    
    // Sheet 3: Clientes
    const customersData = customers.map((customer: any) => ({
      'Nome': customer.nome,
      'E-mail': customer.email,
      'Bandeira': customer.card_brand || 'N/A',
      'Últimos 4 dígitos': customer.last4 || 'N/A',
      'Data Criação': customer.criado,
      'Total Gasto (R$)': (customer.total_gasto || 0).toFixed(2),
      'Nº Pagamentos': customer.pagamentos,
      'Reembolsos (R$)': (customer.reembolsos_valor || 0).toFixed(2),
    }));
    const ws3 = XLSX.utils.json_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Clientes');
    
    // Sheet 4: Por Bandeira
    const brandData = byBrand.map((brand: any) => ({
      'Bandeira': brand.bandeira || 'Não informado',
      'Transações': brand.transacoes,
      'Valor Total (R$)': (brand.valor || 0).toFixed(2),
    }));
    const ws4 = XLSX.utils.json_to_sheet(brandData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Por Bandeira');
    
    // Salvar arquivo
    XLSX.writeFile(wb, `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel exportado!",
      description: "O relatório foi baixado com sucesso",
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
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela">
          <ChargesTable data={charges} loading={loading} />
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
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
