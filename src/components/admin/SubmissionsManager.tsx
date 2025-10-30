import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  const handleDownload = async (path: string, filename: string) => {
    const url = await getSignedUrl(path);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.tipo || 'all'}
              onValueChange={(value) => 
                setFilters({ ...filters, tipo: value === 'all' ? undefined : value })
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
                setFilters({ ...filters, status: value === 'all' ? undefined : value })
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
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhuma submissão encontrada
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((submission) => (
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
                          handleDownload(submission.arquivo_path, filename || 'arquivo');
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
