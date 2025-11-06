import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, CheckCircle, XCircle, Trash2, ExternalLink, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoSubmission {
  id: string;
  created_at: string;
  nome: string;
  email: string;
  tipo_participante: string;
  curso: string | null;
  turma: string | null;
  video_url_original: string;
  video_url_normalized: string;
  observacoes: string | null;
  status: 'pendente' | 'aprovado' | 'reprovado';
  parecer: string | null;
}

const VideoSubmissionsManager = () => {
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<VideoSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parecer, setParecer] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
    
    // Realtime subscription
    const channel = supabase
      .channel('video_submissions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'video_submissions' }, 
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('video_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar submissões');
      console.error(error);
    } else {
      setSubmissions((data || []) as VideoSubmission[]);
    }
    setLoading(false);
  };

  const handleView = (submission: VideoSubmission) => {
    setSelectedSubmission(submission);
    setParecer(submission.parecer || '');
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'aprovado' | 'reprovado', parecer?: string) => {
    const { error } = await supabase
      .from('video_submissions')
      .update({ 
        status: newStatus,
        parecer: parecer || null
      })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      console.error(error);
    } else {
      toast.success(`Submissão ${newStatus === 'aprovado' ? 'aprovada' : 'reprovada'} com sucesso`);
      fetchSubmissions();
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta submissão?')) return;

    const { error } = await supabase
      .from('video_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir submissão');
      console.error(error);
    } else {
      toast.success('Submissão excluída com sucesso');
      fetchSubmissions();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pendente: 'secondary',
      aprovado: 'default',
      reprovado: 'destructive'
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchStatus = filterStatus === 'todos' || sub.status === filterStatus;
    const matchTipo = filterTipo === 'todos' || sub.tipo_participante === filterTipo;
    const matchSearch = searchTerm === '' || 
      sub.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchTipo && matchSearch;
  });

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Envio de Vídeos</h2>
        <p className="text-muted-foreground">Gerencie as submissões de vídeos recebidas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="reprovado">Reprovado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Tipos</SelectItem>
            <SelectItem value="Aluno(a) VCCU">Aluno(a) VCCU</SelectItem>
            <SelectItem value="Participante Externo">Participante Externo</SelectItem>
            <SelectItem value="Convidado(a)">Convidado(a)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Curso/Turma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma submissão encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(sub.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{sub.nome}</TableCell>
                  <TableCell>{sub.email}</TableCell>
                  <TableCell className="whitespace-nowrap">{sub.tipo_participante}</TableCell>
                  <TableCell>
                    {sub.curso ? `${sub.curso}${sub.turma ? ` - ${sub.turma}` : ''}` : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(sub)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(sub.video_url_original, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Submissão</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm font-medium">{selectedSubmission.nome}</p>
                </div>
                <div>
                  <Label>E-mail</Label>
                  <p className="text-sm font-medium">{selectedSubmission.email}</p>
                </div>
                <div>
                  <Label>Tipo de Participante</Label>
                  <p className="text-sm font-medium">{selectedSubmission.tipo_participante}</p>
                </div>
                <div>
                  <Label>Status Atual</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
                {selectedSubmission.curso && (
                  <div>
                    <Label>Curso</Label>
                    <p className="text-sm font-medium">{selectedSubmission.curso}</p>
                  </div>
                )}
                {selectedSubmission.turma && (
                  <div>
                    <Label>Turma</Label>
                    <p className="text-sm font-medium">{selectedSubmission.turma}</p>
                  </div>
                )}
              </div>

              {selectedSubmission.observacoes && (
                <div>
                  <Label>Observações do Participante</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedSubmission.observacoes}
                  </p>
                </div>
              )}

              <div>
                <Label>Link do Vídeo</Label>
                <a 
                  href={selectedSubmission.video_url_original}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  {selectedSubmission.video_url_original}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div>
                <Label htmlFor="parecer">Parecer da Banca</Label>
                <Textarea
                  id="parecer"
                  value={parecer}
                  onChange={(e) => setParecer(e.target.value)}
                  placeholder="Insira o parecer da banca avaliadora..."
                  rows={4}
                />
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatus(selectedSubmission.id, 'reprovado', parecer)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reprovar
                </Button>
                <Button
                  onClick={() => handleUpdateStatus(selectedSubmission.id, 'aprovado', parecer)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoSubmissionsManager;