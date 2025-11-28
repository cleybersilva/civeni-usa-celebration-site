
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, FileSpreadsheet, TrendingUp, Calendar, Users, DollarSign, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface RegistrationReport {
  id: string;
  email: string;
  full_name: string;
  category_name: string;
  batch_number: string; // Changed to string since we're now showing lote names
  payment_status: string;
  amount_paid: number;
  currency: string;
  coupon_code: string;
  payment_method: string;
  card_brand: string;
  installments: number;
  payment_type: string;
  created_at: string;
  updated_at: string;
}

interface ReportSummary {
  totalRegistrations: number;
  completedPayments: number;
  pendingPayments: number;
  totalRevenue: number;
  averageTicket: number;
  conversionRate: number;
}

const RegistrationReports = () => {
  const { t } = useTranslation();
  const { user } = useAdminAuth();
  const [reports, setReports] = useState<RegistrationReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const { toast } = useToast();
  
  // Only admin_root can access full financial reports
  const canAccessFinancialData = user?.user_type === 'admin_root';
  
  // Non-admin-root cannot access registration reports at all
  if (!user || (user.user_type !== 'admin_root' && user.user_type !== 'admin')) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Acesso restrito: Apenas usuários Admin podem visualizar relatórios de inscrições.
        </AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Simple query without joins for now to avoid FK issues
      let query = supabase
        .from('event_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtro de período
      if (selectedPeriod !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (selectedPeriod) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: registrations, error } = await query;

      if (error) throw error;

      const formattedReports = registrations?.map(reg => ({
        id: reg.id,
        email: canAccessFinancialData ? reg.email : reg.email.substring(0, 3) + '***@' + reg.email.split('@')[1],
        full_name: reg.full_name,
        category_name: 'Categoria', // Simplified for now
        batch_number: 'Lote Atual', // Simplified for now
        payment_status: reg.payment_status,
        amount_paid: canAccessFinancialData ? (reg.amount_paid || 0) : 0, // Hide amounts from non-root
        currency: reg.currency,
        coupon_code: reg.coupon_code || 'Não usado',
        payment_method: canAccessFinancialData ? (reg.payment_method || 'N/A') : 'Restrito',
        card_brand: canAccessFinancialData ? (reg.card_brand || 'N/A') : 'Restrito',
        installments: canAccessFinancialData ? (reg.installments || 1) : 0,
        payment_type: canAccessFinancialData ? (reg.payment_type || 'N/A') : 'Restrito',
        created_at: reg.created_at,
        updated_at: reg.updated_at
      })) || [];

      setReports(formattedReports);
      
      // Calcular resumo (apenas admin_root vê dados financeiros reais)
      const totalRegistrations = formattedReports.length;
      const completedPayments = formattedReports.filter(r => r.payment_status === 'completed').length;
      const pendingPayments = formattedReports.filter(r => r.payment_status === 'pending').length;
      const totalRevenue = canAccessFinancialData ? formattedReports
        .filter(r => r.payment_status === 'completed')
        .reduce((sum, r) => sum + r.amount_paid, 0) : 0;
      const averageTicket = canAccessFinancialData && completedPayments > 0 ? totalRevenue / completedPayments : 0;
      const conversionRate = totalRegistrations > 0 ? (completedPayments / totalRegistrations) * 100 : 0;

      setSummary({
        totalRegistrations,
        completedPayments,
        pendingPayments,
        totalRevenue,
        averageTicket,
        conversionRate
      });

    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID', 'Email', 'Nome Completo', 'Categoria', 'Lote', 'Status Pagamento',
      'Valor Pago', 'Moeda', 'Cupom', 'Método Pagamento', 'Bandeira Cartão',
      'Parcelas', 'Tipo Pagamento', 'Data Criação', 'Data Atualização'
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.id,
        report.email,
        report.full_name,
        report.category_name,
        report.batch_number,
        report.payment_status,
        report.amount_paid,
        report.currency,
        report.coupon_code,
        report.payment_method,
        report.card_brand,
        report.installments,
        report.payment_type,
        new Date(report.created_at).toLocaleDateString('pt-BR'),
        new Date(report.updated_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_inscricoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Exportação Concluída",
      description: "Relatório CSV baixado com sucesso!"
    });
  };

  const exportToPDF = async () => {
    try {
      // Criando conteúdo HTML para PDF
      const htmlContent = `
        <html>
          <head>
            <title>Relatório de Inscrições</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Relatório de Inscrições - III Civeni USA 2025</h1>
              <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Categoria</th>
                  <th>Lote</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Pagamento</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                ${reports.map(report => `
                  <tr>
                    <td>${report.full_name}</td>
                    <td>${report.email}</td>
                    <td>${report.category_name}</td>
                     <td>${report.batch_number}</td>
                    <td>${report.payment_status}</td>
                    <td>R$ ${report.amount_paid.toFixed(2)}</td>
                    <td>${report.payment_method} ${report.card_brand !== 'N/A' ? `(${report.card_brand})` : ''}</td>
                    <td>${new Date(report.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: "PDF Gerado",
        description: "Relatório PDF aberto para impressão!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { label: 'Pago', variant: 'default' as const },
      'pending': { label: 'Pendente', variant: 'secondary' as const },
      'failed': { label: 'Falhou', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando relatórios...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-registration-reports>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-blue-600 font-medium">Total Inscrições</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900">{summary.totalRegistrations}</p>
                </div>
                <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-green-600 font-medium">Receita Total</p>
                  {canAccessFinancialData ? (
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-900">R$ {summary.totalRevenue.toFixed(2)}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      Restrito
                    </div>
                  )}
                </div>
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-purple-600 font-medium">Ticket Médio</p>
                  {canAccessFinancialData ? (
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">R$ {summary.averageTicket.toFixed(2)}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      Restrito
                    </div>
                  )}
                </div>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-orange-600 font-medium">Conversão</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-900">{summary.conversionRate.toFixed(1)}%</p>
                </div>
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="detailed" className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="detailed" className="text-xs sm:text-sm">Relatório Detalhado</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Análise</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <option value="all">Todos</option>
              <option value="today">Hoje</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </select>
            
            <Button onClick={exportToCSV} variant="outline" size="sm" data-export-csv className="flex-1 sm:flex-none text-xs">
              <FileSpreadsheet className="w-3 h-3 mr-1" />
              CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm" data-export-pdf className="flex-1 sm:flex-none text-xs">
              <FileText className="w-3 h-3 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Inscrições Detalhadas ({reports.length} registros)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Cupom</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.full_name}</TableCell>
                        <TableCell>{report.email}</TableCell>
                        <TableCell>{report.category_name}</TableCell>
                        <TableCell>{report.batch_number}</TableCell>
                        <TableCell>{getStatusBadge(report.payment_status)}</TableCell>
                        <TableCell>
                          {canAccessFinancialData ? (
                            `R$ ${report.amount_paid.toFixed(2)}`
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              Restrito
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {canAccessFinancialData ? (
                            <div className="text-sm">
                              <div>{report.payment_method}</div>
                              {report.card_brand !== 'N/A' && report.card_brand !== 'Restrito' && (
                                <div className="text-gray-500">
                                  {report.card_brand} - {report.installments}x
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              Restrito
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{report.coupon_code}</TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {reports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma inscrição encontrada para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Distribuição por Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span>Pagamentos Confirmados</span>
                      <span className="font-bold text-green-700">{summary?.completedPayments || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span>Pagamentos Pendentes</span>
                      <span className="font-bold text-yellow-700">{summary?.pendingPayments || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Métricas de Conversão</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span>Taxa de Conversão</span>
                      <span className="font-bold text-blue-700">{summary?.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span>Ticket Médio</span>
                      <span className="font-bold text-purple-700">R$ {summary?.averageTicket.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegistrationReports;
