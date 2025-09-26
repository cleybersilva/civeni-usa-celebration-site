import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  Search,
  Edit3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface WorkSubmission {
  id: string;
  author_name: string;
  institution: string;
  email: string;
  work_title: string;
  abstract: string;
  keywords: string;
  thematic_area: string;
  file_path: string | null;
  file_name: string | null;
  status: string;
  internal_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  submission_kind: string;
}

const WorkSubmissionsManager = () => {
  const [submissions, setSubmissions] = useState<WorkSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<WorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<WorkSubmission | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const thematicAreas = [
    "Educação e Tecnologia",
    "Metodologias Inovadoras", 
    "Formação Docente",
    "Educação Global",
    "Neuroeducação",
    "Educação Digital"
  ];

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter, areaFilter, kindFilter]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('work_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.error('Erro ao carregar submissões');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.work_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    if (areaFilter !== 'all') {
      filtered = filtered.filter(submission => submission.thematic_area === areaFilter);
    }

    if (kindFilter !== 'all') {
      filtered = filtered.filter(submission => submission.submission_kind === kindFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const updateSubmissionStatus = async (id: string, status: string, notes?: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('work_submissions')
        .update({
          status,
          internal_notes: notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'Admin' // You might want to get the actual admin user
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success(`Submissão ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso`);
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast.error('Erro ao atualizar submissão');
    } finally {
      setIsUpdating(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('work-submissions')
        .download(filePath);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civeni-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Submissões de Trabalhos</h2>
        <div className="text-sm text-gray-500">
          Total: {submissions.length} | Pendentes: {submissions.filter(s => s.status === 'pending').length}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por autor, instituição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Área Temática" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Áreas</SelectItem>
                {thematicAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             <Select value={kindFilter} onValueChange={setKindFilter}>
               <SelectTrigger>
                 <SelectValue placeholder="Tipo de Submissão" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os Tipos</SelectItem>
                 <SelectItem value="artigo">Artigo</SelectItem>
                 <SelectItem value="consorcio">Consórcio</SelectItem>
               </SelectContent>
             </Select>
             <Button
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setAreaFilter('all');
                  setKindFilter('all');
                }}
              >
              <Filter className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <div className="grid gap-4">
        {filteredSubmissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(submission.status)}
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {submission.work_title}
                    </h3>
                    {getStatusBadge(submission.status)}
                  </div>
                  
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                     <div>
                       <span className="font-medium">Autor:</span> {submission.author_name}
                     </div>
                     <div>
                       <span className="font-medium">Instituição:</span> {submission.institution}
                     </div>
                     <div>
                       <span className="font-medium">Área:</span> {submission.thematic_area}
                     </div>
                     <div>
                       <span className="font-medium">Tipo:</span> {submission.submission_kind === 'artigo' ? 'Artigo' : 'Consórcio'}
                     </div>
                   </div>

                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Submetido em:</span> {new Date(submission.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  
                  {submission.reviewed_at && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Revisado em:</span> {new Date(submission.reviewed_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 ml-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setInternalNotes(submission.internal_notes || '');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Submissão</DialogTitle>
                      </DialogHeader>
                      {selectedSubmission && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Autor</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedSubmission.author_name}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Instituição</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedSubmission.institution}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">E-mail</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedSubmission.email}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Área Temática</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedSubmission.thematic_area}</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Título</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedSubmission.work_title}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Resumo</label>
                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedSubmission.abstract}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Palavras-chave</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedSubmission.keywords}</p>
                          </div>

                          {selectedSubmission.file_path && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo</label>
                              <Button
                                onClick={() => downloadFile(selectedSubmission.file_path!, selectedSubmission.file_name!)}
                                className="flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                {selectedSubmission.file_name}
                              </Button>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Anotações Internas</label>
                            <Textarea
                              value={internalNotes}
                              onChange={(e) => setInternalNotes(e.target.value)}
                              placeholder="Adicione anotações sobre esta submissão..."
                              className="h-24"
                            />
                          </div>

                          <div className="flex gap-4 pt-4 border-t">
                            <Button
                              onClick={() => updateSubmissionStatus(selectedSubmission.id, 'approved', internalNotes)}
                              disabled={isUpdating}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button
                              onClick={() => updateSubmissionStatus(selectedSubmission.id, 'rejected', internalNotes)}
                              disabled={isUpdating}
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Rejeitar
                            </Button>
                            {selectedSubmission.status !== 'pending' && (
                              <Button
                                onClick={() => updateSubmissionStatus(selectedSubmission.id, 'pending', internalNotes)}
                                disabled={isUpdating}
                                variant="outline"
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Marcar como Pendente
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {submission.file_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(submission.file_path!, submission.file_name!)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubmissions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma submissão encontrada</h3>
              <p className="text-gray-500">
                {submissions.length === 0 
                  ? 'Ainda não há submissões de trabalhos.' 
                  : 'Nenhuma submissão corresponde aos filtros aplicados.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkSubmissionsManager;