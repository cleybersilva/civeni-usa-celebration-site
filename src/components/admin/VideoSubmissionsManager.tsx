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
import { Eye, CheckCircle, XCircle, Trash2, ExternalLink, Search, Plus, Edit, Archive } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoSubmission {
  id: string;
  created_at: string;
  updated_at: string;
  nome: string;
  email: string;
  tipo_participante: string;
  curso: string | null;
  turma: string | null;
  work_title: string | null;
  video_url_original: string;
  video_url_normalized: string;
  video_platform: string | null;
  category: string | null;
  modality: string | null;
  observacoes: string | null;
  status: 'pendente' | 'aprovado' | 'reprovado';
  parecer: string | null;
  submission_origin: string;
  event_edition: string;
  is_deleted: boolean;
}

const VideoSubmissionsManager = () => {
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<VideoSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterOrigin, setFilterOrigin] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Form data para criar/editar
  const [formData, setFormData] = useState<Partial<VideoSubmission>>({
    nome: '',
    email: '',
    tipo_participante: '',
    curso: '',
    turma: '',
    work_title: '',
    video_url_original: '',
    video_platform: '',
    category: '',
    modality: '',
    observacoes: '',
    status: 'pendente',
    parecer: '',
    submission_origin: 'saas',
    event_edition: 'III CIVENI 2025'
  });

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
  }, [showArchived]);

  const fetchSubmissions = async () => {
    setLoading(true);
    let query = supabase
      .from('video_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filtrar por is_deleted
    if (!showArchived) {
      query = query.eq('is_deleted', false);
    }

    const { data, error } = await query;

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
    setFormData(submission);
    setIsEditMode(false);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (submission: VideoSubmission) => {
    setSelectedSubmission(submission);
    setFormData(submission);
    setIsEditMode(true);
    setIsCreateMode(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedSubmission(null);
    setFormData({
      nome: '',
      email: '',
      tipo_participante: '',
      curso: '',
      turma: '',
      work_title: '',
      video_url_original: '',
      video_platform: '',
      category: '',
      modality: '',
      observacoes: '',
      status: 'pendente',
      parecer: '',
      submission_origin: 'saas',
      event_edition: 'III CIVENI 2025'
    });
    setIsEditMode(true);
    setIsCreateMode(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.email || !formData.tipo_participante || !formData.video_url_original) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.tipo_participante === 'Aluno(a) VCCU' && (!formData.curso || !formData.turma)) {
      toast.error('Curso e Turma são obrigatórios para Alunos VCCU');
      return;
    }

    if (isCreateMode) {
      // Criar novo
      const { error } = await supabase
        .from('video_submissions')
        .insert({
          nome: formData.nome!,
          email: formData.email!,
          tipo_participante: formData.tipo_participante!,
          curso: formData.curso || null,
          turma: formData.turma || null,
          work_title: formData.work_title || null,
          video_url_original: formData.video_url_original!,
          video_url_normalized: formData.video_url_original!,
          video_platform: formData.video_platform || null,
          category: formData.category || null,
          modality: formData.modality || null,
          observacoes: formData.observacoes || null,
          status: formData.status || 'pendente',
          parecer: formData.parecer || null,
          submission_origin: formData.submission_origin || 'saas',
          event_edition: formData.event_edition || 'III CIVENI 2025'
        });

      if (error) {
        toast.error('Erro ao criar submissão');
        console.error(error);
      } else {
        toast.success('Submissão criada com sucesso');
        fetchSubmissions();
        setIsDialogOpen(false);
      }
    } else {
      // Atualizar existente
      const { error } = await supabase
        .from('video_submissions')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission?.id);

      if (error) {
        toast.error('Erro ao atualizar submissão');
        console.error(error);
      } else {
        toast.success('Submissão atualizada com sucesso');
        fetchSubmissions();
        setIsDialogOpen(false);
      }
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta submissão? Ela será arquivada e não aparecerá na lista principal.')) return;

    const { error } = await supabase
      .from('video_submissions')
      .update({ is_deleted: true })
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

  const getOriginBadge = (origin: string) => {
    return (
      <Badge variant={origin === 'site' ? 'outline' : 'default'}>
        {origin === 'site' ? 'Site' : 'SaaS'}
      </Badge>
    );
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchStatus = filterStatus === 'todos' || sub.status === filterStatus;
    const matchTipo = filterTipo === 'todos' || sub.tipo_participante === filterTipo;
    const matchOrigin = filterOrigin === 'todos' || sub.submission_origin === filterOrigin;
    const matchSearch = searchTerm === '' || 
      sub.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.work_title && sub.work_title.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchTipo && matchOrigin && matchSearch;
  });

  // Reset para página 1 quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterTipo, filterOrigin, searchTerm, showArchived]);

  // Paginação
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gerenciar Envio de Vídeos</h2>
          <p className="text-muted-foreground">
            Total: {filteredSubmissions.length} submissões
            {showArchived && ' (incluindo excluídas)'}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Criar novo envio
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou título..."
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

        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="site">Site</SelectItem>
            <SelectItem value="saas">SaaS</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant={showArchived ? "default" : "outline"}
          onClick={() => setShowArchived(!showArchived)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {showArchived ? 'Ocultar' : 'Mostrar'} Excluídas
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma submissão encontrada
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubmissions.map((sub) => (
                <TableRow key={sub.id} className={sub.is_deleted ? 'opacity-50' : ''}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(sub.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{sub.nome}</TableCell>
                  <TableCell>{sub.email}</TableCell>
                  <TableCell>{sub.work_title || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap">{sub.tipo_participante}</TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>{getOriginBadge(sub.submission_origin)}</TableCell>
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
                        onClick={() => handleEdit(sub)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(sub.video_url_original, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {!sub.is_deleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleArchive(sub.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {filteredSubmissions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredSubmissions.length)} de {filteredSubmissions.length}
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
                Itens por página:
              </Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="items-per-page" className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-9"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Última
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog de Detalhes/Edição/Criação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? 'Criar Novo Envio' : isEditMode ? 'Editar Submissão' : 'Detalhes da Submissão'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                {isEditMode ? (
                  <Input
                    id="nome"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{formData.nome}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                {isEditMode ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{formData.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tipo_participante">Tipo de Participante *</Label>
                {isEditMode ? (
                  <Select 
                    value={formData.tipo_participante} 
                    onValueChange={(value) => setFormData({ ...formData, tipo_participante: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aluno(a) VCCU">Aluno(a) VCCU</SelectItem>
                      <SelectItem value="Participante Externo">Participante Externo</SelectItem>
                      <SelectItem value="Convidado(a)">Convidado(a)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium">{formData.tipo_participante}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                {isEditMode ? (
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">{getStatusBadge(formData.status || 'pendente')}</div>
                )}
              </div>

              {formData.tipo_participante === 'Aluno(a) VCCU' && (
                <>
                  <div>
                    <Label htmlFor="curso">Curso *</Label>
                    {isEditMode ? (
                      <Input
                        id="curso"
                        value={formData.curso || ''}
                        onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{formData.curso || '-'}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="turma">Turma *</Label>
                    {isEditMode ? (
                      <Input
                        id="turma"
                        value={formData.turma || ''}
                        onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{formData.turma || '-'}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="work_title">Título do Trabalho</Label>
                {isEditMode ? (
                  <Input
                    id="work_title"
                    value={formData.work_title || ''}
                    onChange={(e) => setFormData({ ...formData, work_title: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{formData.work_title || '-'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Categoria/Área</Label>
                {isEditMode ? (
                  <Input
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{formData.category || '-'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="modality">Modalidade</Label>
                {isEditMode ? (
                  <Input
                    id="modality"
                    value={formData.modality || ''}
                    onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{formData.modality || '-'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="event_edition">Edição do Evento</Label>
                {isEditMode ? (
                  <Input
                    id="event_edition"
                    value={formData.event_edition || ''}
                    onChange={(e) => setFormData({ ...formData, event_edition: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium">{formData.event_edition || '-'}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="video_url_original">Link do Vídeo *</Label>
              {isEditMode ? (
                <Input
                  id="video_url_original"
                  type="url"
                  value={formData.video_url_original || ''}
                  onChange={(e) => setFormData({ ...formData, video_url_original: e.target.value })}
                />
              ) : (
                <a 
                  href={formData.video_url_original}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-2"
                >
                  {formData.video_url_original}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {formData.observacoes && !isEditMode && (
              <div>
                <Label>Observações do Participante</Label>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {formData.observacoes}
                </p>
              </div>
            )}

            {isEditMode && (
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            <div>
              <Label htmlFor="parecer">Parecer da Banca</Label>
              {isEditMode ? (
                <Textarea
                  id="parecer"
                  value={formData.parecer || ''}
                  onChange={(e) => setFormData({ ...formData, parecer: e.target.value })}
                  rows={4}
                  placeholder="Insira o parecer da banca avaliadora..."
                />
              ) : formData.parecer ? (
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {formData.parecer}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum parecer registrado</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              {isEditMode ? 'Cancelar' : 'Fechar'}
            </Button>
            {isEditMode && (
              <Button onClick={handleSave}>
                {isCreateMode ? 'Criar' : 'Salvar'}
              </Button>
            )}
            {!isEditMode && !isCreateMode && (
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoSubmissionsManager;