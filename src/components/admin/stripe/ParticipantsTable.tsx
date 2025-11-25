import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, CreditCard, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Trash2, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ParticipantsTableProps {
  data: any[];
  loading?: boolean;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onPageChange?: (offset: number) => void;
  onDelete?: (email: string) => void;
  deletingCustomer?: string | null;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  cursoFilter?: string;
  onCursoFilterChange?: (cursoId: string) => void;
  turmaFilter?: string;
  onTurmaFilterChange?: (turmaId: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  paymentMethodFilter?: string;
  onPaymentMethodFilterChange?: (method: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
}

export const ParticipantsTable: React.FC<ParticipantsTableProps> = ({ 
  data, 
  loading, 
  pagination,
  onPageChange,
  onDelete,
  deletingCustomer,
  searchValue = '',
  onSearchChange,
  cursoFilter = '',
  onCursoFilterChange,
  turmaFilter = '',
  onTurmaFilterChange,
  statusFilter = '',
  onStatusFilterChange,
  paymentMethodFilter = '',
  onPaymentMethodFilterChange,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange
}) => {
  const { toast } = useToast();
  const [sortField, setSortField] = useState<'data' | 'nome'>('data');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [cursos, setCursos] = useState<Array<{id: string, nome_curso: string}>>([]);
  const [turmas, setTurmas] = useState<Array<{id: string, nome_turma: string}>>([]);

  // Buscar lista de cursos e turmas
  React.useEffect(() => {
    const fetchData = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: cursosData } = await supabase
        .from('cursos')
        .select('id, nome_curso')
        .order('nome_curso');
      if (cursosData) setCursos(cursosData);
      
      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, nome_turma')
        .order('nome_turma');
      if (turmasData) setTurmas(turmasData);
    };
    fetchData();
  }, []);

  const sortedData = useMemo(() => {
    if (!data) return [];
    
    const sorted = [...data].sort((a, b) => {
      if (sortField === 'data') {
        const dateA = new Date(a.criado).getTime();
        const dateB = new Date(b.criado).getTime();
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        const nameA = a.nome.toLowerCase();
        const nameB = b.nome.toLowerCase();
        if (sortDirection === 'desc') {
          return nameB.localeCompare(nameA);
        } else {
          return nameA.localeCompare(nameB);
        }
      }
    });
    
    return sorted;
  }, [data, sortField, sortDirection]);

  const toggleSort = (field: 'data' | 'nome') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection(field === 'data' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = (field: 'data' | 'nome') => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'desc' ? 
      <ArrowDown className="h-4 w-4 ml-1" /> : 
      <ArrowUp className="h-4 w-4 ml-1" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processando</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="border-t-4 border-t-purple-500">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardTitle className="text-purple-700 dark:text-purple-300">Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando participantes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-t-4 border-t-purple-500">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 px-4 sm:px-6">
        <div className="space-y-2">
          <CardTitle className="text-purple-700 dark:text-purple-300 text-lg sm:text-xl">Participantes</CardTitle>
          <div className="flex items-start gap-2 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Exclusão de Registros</p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Use o botão "Excluir" para remover TODOS os registros de um participante específico. 
                Esta ação é irreversível e requer confirmação.
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {/* Filtros */}
        <div className="mb-3 sm:mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchValue}
                onChange={(e) => {
                  onSearchChange?.(e.target.value);
                  onPageChange?.(0);
                }}
                className="pl-10 text-sm"
              />
            </div>
            <select
              value={cursoFilter}
              onChange={(e) => {
                onCursoFilterChange?.(e.target.value);
                onTurmaFilterChange?.('');
                onPageChange?.(0);
              }}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full sm:w-auto sm:min-w-[200px]"
            >
              <option value="">Todos os Cursos</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome_curso}
                </option>
              ))}
            </select>
            <select
              value={turmaFilter}
              onChange={(e) => {
                onTurmaFilterChange?.(e.target.value);
                onPageChange?.(0);
              }}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full sm:w-auto sm:min-w-[150px]"
            >
              <option value="">Todas as Turmas</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome_turma}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                onStatusFilterChange?.(e.target.value);
                onPageChange?.(0);
              }}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full sm:w-auto sm:min-w-[150px]"
            >
              <option value="">Todos os Status</option>
              <option value="completed">Pago</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="failed">Falhou</option>
            </select>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                onPaymentMethodFilterChange?.(e.target.value);
                onPageChange?.(0);
              }}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="">Todas as Formas</option>
              <option value="voucher">Voucher/Gratuito</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="elo">Elo</option>
              <option value="amex">Amex</option>
            </select>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                onStartDateChange?.(e.target.value);
                onPageChange?.(0);
              }}
              placeholder="Data Inicial"
              className="w-full sm:w-auto sm:min-w-[150px] text-sm"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                onEndDateChange?.(e.target.value);
                onPageChange?.(0);
              }}
              placeholder="Data Final"
              className="w-full sm:w-auto sm:min-w-[150px] text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="min-w-[1000px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSort('nome')}
                    className="flex items-center hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Nome
                    {getSortIcon('nome')}
                  </Button>
                </TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSort('data')}
                    className="flex items-center hover:bg-transparent p-0 h-auto font-medium"
                  >
                    Criado
                    {getSortIcon('data')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
                <TableHead className="text-center">Pagamentos</TableHead>
                <TableHead className="text-right">Reembolsos</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    Nenhum participante encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((participant) => (
                  <TableRow key={participant.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium">{participant.nome}</p>
                        <p className="text-xs text-muted-foreground">{participant.participant_type || 'Não especificado'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <a 
                        href={participant.stripe_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline flex items-center gap-1"
                      >
                        {participant.email}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{participant.curso || 'Não especificado'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{participant.turma || 'Não especificado'}</span>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(participant.payment_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {participant.card_brand ? (
                          <>
                            <CreditCard className="h-4 w-4" />
                            <span className="font-medium capitalize">{participant.card_brand}</span>
                            {participant.last4 && (
                              <span className="text-muted-foreground">•••• {participant.last4}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            {participant.payment_status === 'completed' ? 'Voucher/Gratuito' : 'Não definida'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {participant.criado}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(participant.total_gasto)}
                    </TableCell>
                    <TableCell className="text-center">
                      {participant.pagamentos}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(participant.reembolsos_valor || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(participant.email)}
                          disabled={deletingCustomer === participant.email}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          title={`Excluir todos os registros de ${participant.email}`}
                        >
                          {deletingCustomer === participant.email ? (
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
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Paginação */}
        {pagination && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="hidden sm:inline">Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} participantes</span>
              <span className="sm:hidden">{pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
                className="text-xs sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.offset + pagination.limit)}
                disabled={!pagination.hasMore}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Próxima</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
