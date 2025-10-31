import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Archive, 
  RotateCcw,
  MoreVertical,
  FileText,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { useSubmissions } from '@/hooks/useSubmissions';
import { SubmissionDetailsDialog } from './SubmissionDetailsDialog';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export const SubmissionsManager = () => {
  const {
    submissions,
    loading,
    filters,
    setFilters,
    getSignedUrl,
    validateSubmission,
    invalidateSubmission,
    archiveSubmission,
    restoreSubmission,
  } = useSubmissions();

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calcular paginação
  const totalPages = Math.ceil(submissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = submissions.slice(startIndex, endIndex);

  // Resetar para primeira página quando filtros mudarem
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleDownload = async (submissionId: string, filename: string) => {
    console.log('handleDownload - Submission ID:', submissionId, 'Filename:', filename);
    try {
      const url = await getSignedUrl(submissionId);
      
      if (url) {
        console.log('Iniciando download com URL:', url);
        // Usar window.location.href para evitar popup blockers
        window.location.href = url;
        toast.success('Download iniciado');
      } else {
        toast.error('Não foi possível gerar o link do arquivo');
      }
    } catch (error: any) {
      console.error('Erro em handleDownload:', error);
      toast.error('Erro ao baixar arquivo: ' + error.message);
    }
  };

  const handleViewDetails = (submission: any) => {
    setSelectedSubmission(submission);
    setDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      recebido: { variant: 'default', label: 'Recebido' },
      em_analise: { variant: 'secondary', label: 'Em Análise' },
      validado: { variant: 'default', label: 'Validado' },
      invalidado: { variant: 'destructive', label: 'Invalidado' },
      arquivado: { variant: 'outline', label: 'Arquivado' },
    };

    const config = variants[status] || variants.recebido;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    return (
      <Badge variant={tipo === 'artigo' ? 'default' : 'secondary'}>
        {tipo === 'artigo' ? 'Artigo' : 'Consórcio'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Submissão Artigos/Consórcio</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as submissões de artigos e trabalhos de consórcio recebidos
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{submissions.length} submissões</span>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por título, autor ou email..."
                  value={filters.q || ''}
                  onChange={(e) => handleFiltersChange({ ...filters, q: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.tipo || 'all'}
              onValueChange={(value) => 
                handleFiltersChange({ ...filters, tipo: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="artigo">Artigo</SelectItem>
                <SelectItem value="consorcio">Consórcio</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                handleFiltersChange({ ...filters, status: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="validado">Validado</SelectItem>
                <SelectItem value="invalidado">Invalidado</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma submissão encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(submission.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{getTipoBadge(submission.tipo)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {submission.titulo}
                    </TableCell>
                    <TableCell>{submission.autor_principal}</TableCell>
                    <TableCell>{submission.email}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {submission.area_tematica || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const filename = submission.arquivo_path.split('/').pop();
                          handleDownload(submission.id, filename || 'arquivo');
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(submission)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          
                          {submission.status !== 'validado' && (
                            <DropdownMenuItem
                              onClick={() => validateSubmission(submission.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Validar
                            </DropdownMenuItem>
                          )}
                          
                          {submission.status !== 'invalidado' && (
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(submission)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Invalidar
                            </DropdownMenuItem>
                          )}
                          
                          {submission.status !== 'arquivado' ? (
                            <DropdownMenuItem
                              onClick={() => archiveSubmission(submission.id)}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => restoreSubmission(submission.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restaurar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {submissions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, submissions.length)} de {submissions.length} submissões
            </div>
            
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar primeira página, última página, página atual e páginas adjacentes
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </Card>

      {selectedSubmission && (
        <SubmissionDetailsDialog
          submission={selectedSubmission}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onValidate={validateSubmission}
          onInvalidate={invalidateSubmission}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
