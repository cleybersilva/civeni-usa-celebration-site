
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationReport {
  id: string;
  email: string;
  full_name: string;
  category_name: string;
  batch_number: number;
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

const RegistrationReports = () => {
  const [reports, setReports] = useState<RegistrationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data: registrations, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          registration_categories(category_name),
          registration_batches(batch_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports = registrations?.map(reg => ({
        id: reg.id,
        email: reg.email,
        full_name: reg.full_name,
        category_name: reg.registration_categories?.category_name || 'N/A',
        batch_number: reg.registration_batches?.batch_number || 0,
        payment_status: reg.payment_status,
        amount_paid: reg.amount_paid || 0,
        currency: reg.currency,
        coupon_code: reg.coupon_code || 'Não usado',
        payment_method: reg.payment_method || 'N/A',
        card_brand: reg.card_brand || 'N/A',
        installments: reg.installments || 1,
        payment_type: reg.payment_type || 'N/A',
        created_at: reg.created_at,
        updated_at: reg.updated_at
      })) || [];

      setReports(formattedReports);
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
                    <td>Lote ${report.batch_number}</td>
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatórios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Relatório Detalhado de Inscrições</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
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
                  <TableCell>Lote {report.batch_number}</TableCell>
                  <TableCell>{getStatusBadge(report.payment_status)}</TableCell>
                  <TableCell>R$ {report.amount_paid.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{report.payment_method}</div>
                      {report.card_brand !== 'N/A' && (
                        <div className="text-gray-500">
                          {report.card_brand} - {report.installments}x
                        </div>
                      )}
                    </div>
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
            Nenhuma inscrição encontrada
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RegistrationReports;
