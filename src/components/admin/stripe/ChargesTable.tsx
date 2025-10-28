import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ChevronLeft, ChevronRight, Copy, CheckCircle2, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ChargesTableProps {
  data: any[];
  loading?: boolean;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onPageChange?: (offset: number) => void;
}

export const ChargesTable: React.FC<ChargesTableProps> = ({ 
  data, 
  loading, 
  pagination,
  onPageChange 
}) => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getStatusBadge = (status: string, paid: boolean) => {
    if (status === 'succeeded' && paid) {
      return <Badge className="bg-green-500">Confirmado</Badge>;
    }
    if (status === 'processing') {
      return <Badge variant="secondary">Processando</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="destructive">Falhou</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para área de transferência`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Transações Detalhadas - Stripe', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 25, { align: 'center' });
      
      // Tabela
      autoTable(doc, {
        startY: 45,
        head: [['Data/Hora', 'Participante', 'Email', 'Valor Bruto', 'Taxa', 'Líquido', 'Status', 'Bandeira', 'Lote']],
        body: data.map(charge => [
          charge.data_hora_brt,
          charge.participante,
          charge.email,
          `R$ ${charge.valor_bruto.toFixed(2)}`,
          `R$ ${charge.taxa.toFixed(2)}`,
          `R$ ${charge.valor_liquido.toFixed(2)}`,
          charge.status,
          charge.bandeira,
          charge.lote
        ]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 }
      });
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
      }
      
      doc.save(`transacoes_detalhadas_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "✅ PDF Gerado!",
        description: "Relatório de transações baixado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      });
    }
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Sheet com dados
      const wsData = [
        ['TRANSAÇÕES DETALHADAS - STRIPE'],
        ['Gerado em:', new Date().toLocaleString('pt-BR')],
        [''],
        ['Data/Hora', 'Participante', 'Email', 'Valor Bruto', 'Taxa', 'Líquido', 'Status', 'Bandeira', 'Cartão', 'Lote', 'Cupom', 'ID Transação'],
        ...data.map(charge => [
          charge.data_hora_brt,
          charge.participante,
          charge.email,
          charge.valor_bruto,
          charge.taxa,
          charge.valor_liquido,
          charge.status,
          charge.bandeira,
          charge.last4,
          charge.lote,
          charge.cupom,
          charge.id
        ])
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Largura das colunas
      ws['!cols'] = [
        { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 },
        { wch: 15 }, { wch: 30 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Transações');
      XLSX.writeFile(wb, `transacoes_detalhadas_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "✅ Excel Gerado!",
        description: "Relatório de transações baixado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar Excel",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando transações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Detalhadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora (BRT)</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead>ID Transação</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método/Bandeira</TableHead>
                <TableHead>Cartão</TableHead>
                <TableHead>Lote/Cupom</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Nenhuma transação encontrada no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                data.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {charge.data_hora_brt}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{charge.participante}</p>
                        <p className="text-xs text-muted-foreground">{charge.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {charge.id.substring(charge.id.length - 8)}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(charge.id, 'ID da Transação')}
                        >
                          {copiedId === charge.id ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(charge.valor_bruto)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-red-500">
                      -{formatCurrency(charge.taxa)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {formatCurrency(charge.valor_liquido)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(charge.status, charge.paid)}
                      {charge.failure_code && (
                        <p className="text-xs text-red-500 mt-1" title={charge.failure_message}>
                          {charge.failure_code}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="capitalize w-fit">
                          {charge.bandeira}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {charge.funding}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <code className="bg-muted px-1 py-0.5 rounded">
                          {charge.last4}
                        </code>
                        <p className="text-muted-foreground">{charge.exp}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <p className="font-medium">{charge.lote}</p>
                        {charge.cupom !== 'sem_cupom' && (
                          <Badge variant="secondary" className="text-xs">
                            {charge.cupom}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {charge.payment_intent_id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(charge.payment_intent_id, 'Payment Intent ID')}
                            title="Copiar Payment Intent ID"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          asChild
                          title="Abrir no Stripe Dashboard"
                        >
                          <a 
                            href={charge.stripe_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} transações
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.offset + pagination.limit)}
                disabled={!pagination.hasMore}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Botões de Exportação */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={exportToPDF}
            disabled={data.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={data.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
