import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ChevronLeft, ChevronRight, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      </CardContent>
    </Card>
  );
};
