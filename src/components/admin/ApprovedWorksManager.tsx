import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ApprovedWork {
  id: string;
  area: string;
  numero: number;
  titulo: string;
  autor_responsavel: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface WorkFormData {
  area: string;
  numero: number;
  titulo: string;
  autor_responsavel: string;
  observacoes: string;
}

const AREAS = [
  'EDUCAÇÃO',
  'CIÊNCIAS JURÍDICAS',
  'ADMINISTRAÇÃO, SUSTENTABILIDADE E TECNOLOGIA',
];

export const ApprovedWorksManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<ApprovedWork | null>(null);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<WorkFormData>({
    area: AREAS[0],
    numero: 1,
    titulo: '',
    autor_responsavel: '',
    observacoes: '',
  });

  const { data: works, isLoading } = useQuery({
    queryKey: ['approved-works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approved_works')
        .select('*')
        .order('area')
        .order('numero');

      if (error) throw error;
      return data as ApprovedWork[];
    },
  });

  const getAdminSession = () => {
    const sessionRaw = localStorage.getItem('adminSession');
    if (!sessionRaw) {
      console.error('[getAdminSession] No adminSession in localStorage');
      throw new Error('Sessão administrativa inválida. Faça login novamente.');
    }
    
    const parsed = JSON.parse(sessionRaw);
    const email = parsed?.user?.email || '';
    const token = parsed?.session_token;
    const expires = parsed?.expires;
    
    console.log('[getAdminSession] Session data:', { 
      email, 
      hasToken: !!token, 
      expires: expires ? new Date(expires).toISOString() : 'N/A',
      now: new Date().toISOString(),
      isExpired: expires ? Date.now() > expires : 'unknown'
    });
    
    if (!email || !token) {
      console.error('[getAdminSession] Missing email or token:', { email, hasToken: !!token });
      throw new Error('Sessão administrativa inválida. Faça login novamente.');
    }
    
    // Check if session is expired locally
    if (expires && Date.now() > expires) {
      console.error('[getAdminSession] Session expired locally');
      localStorage.removeItem('adminSession');
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    return { email, token };
  };

  const createMutation = useMutation({
    mutationFn: async (data: WorkFormData) => {
      const { email, token } = getAdminSession();
      console.log('[createMutation] Calling RPC with:', { 
        email, 
        tokenPrefix: token?.substring(0, 8) + '...',
        workData: data 
      });
      const { data: result, error } = await supabase.rpc('admin_upsert_approved_work', {
        work_data: data as any,
        user_email: email,
        session_token: token,
      });
      if (error) {
        console.error('[createMutation] RPC error:', error);
        throw error;
      }
      console.log('[createMutation] RPC success:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-works'] });
      toast.success('Artigo criado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('[createMutation] Error:', error);
      toast.error(`Erro ao criar artigo: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WorkFormData }) => {
      const { email, token } = getAdminSession();
      const { data: result, error } = await supabase.rpc('admin_upsert_approved_work', {
        work_data: { ...data, id } as any,
        user_email: email,
        session_token: token,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-works'] });
      toast.success('Artigo atualizado com sucesso!');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar artigo: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { email, token } = getAdminSession();
      const { data: result, error } = await supabase.rpc('admin_delete_approved_work', {
        work_id: id,
        user_email: email,
        session_token: token,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-works'] });
      toast.success('Artigo excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir artigo: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      area: AREAS[0],
      numero: 1,
      titulo: '',
      autor_responsavel: '',
      observacoes: '',
    });
    setEditingWork(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.autor_responsavel.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingWork) {
      updateMutation.mutate({ id: editingWork.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (work: ApprovedWork) => {
    setEditingWork(work);
    setFormData({
      area: work.area,
      numero: work.numero,
      titulo: work.titulo,
      autor_responsavel: work.autor_responsavel,
      observacoes: work.observacoes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este artigo?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenNew = () => {
    resetForm();
    // Set next numero based on current works in selected area
    const areaWorks = (works || []).filter(w => w.area === formData.area);
    const maxNumero = areaWorks.length > 0 ? Math.max(...areaWorks.map(w => w.numero)) : 0;
    setFormData(prev => ({ ...prev, numero: maxNumero + 1 }));
    setIsDialogOpen(true);
  };

  const filteredWorks = (works || []).filter((work) => {
    const matchesArea = filterArea === 'all' || work.area === filterArea;
    const matchesSearch =
      searchTerm === '' ||
      work.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.autor_responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesArea && matchesSearch;
  });

  const groupedWorks = AREAS.reduce((acc, area) => {
    acc[area] = filteredWorks.filter(w => w.area === area);
    return acc;
  }, {} as Record<string, ApprovedWork[]>);

  const getAreaBadgeColor = (area: string) => {
    switch (area) {
      case 'EDUCAÇÃO':
        return 'bg-blue-500';
      case 'CIÊNCIAS JURÍDICAS':
        return 'bg-purple-500';
      case 'ADMINISTRAÇÃO, SUSTENTABILIDADE E TECNOLOGIA':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
          Lista de Artigos/Projetos Aprovados
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Artigo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWork ? 'Editar Artigo' : 'Novo Artigo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="area">Área *</Label>
                <Select
                  value={formData.area}
                  onValueChange={(value) => setFormData({ ...formData, area: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  type="number"
                  min={1}
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData({ ...formData, numero: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Textarea
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  required
                  placeholder="Título completo do artigo"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="autor_responsavel">Autor Responsável *</Label>
                <Input
                  id="autor_responsavel"
                  value={formData.autor_responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, autor_responsavel: e.target.value })
                  }
                  required
                  placeholder="Nome do autor responsável"
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  placeholder="Observações opcionais"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingWork ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterArea} onValueChange={setFilterArea}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Filtrar por área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Áreas</SelectItem>
              {AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {AREAS.map((area) => {
          const count = (works || []).filter(w => w.area === area).length;
          return (
            <Card key={area} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getAreaBadgeColor(area)}`} />
                <div>
                  <p className="text-sm text-muted-foreground truncate">{area}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Works by Area */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={AREAS} className="space-y-4">
          {AREAS.map((area) => {
            const areaWorks = groupedWorks[area] || [];
            if (filterArea !== 'all' && filterArea !== area) return null;
            
            return (
              <AccordionItem key={area} value={area} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className={`px-4 py-3 ${getAreaBadgeColor(area)} text-white hover:no-underline`}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold">ÁREA: {area}</span>
                    <Badge variant="secondary" className="ml-2">
                      {areaWorks.length} artigos
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  {areaWorks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhum artigo cadastrado nesta área
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Nº</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Autor Responsável</TableHead>
                            <TableHead className="w-32 text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {areaWorks.map((work) => (
                            <TableRow key={work.id}>
                              <TableCell className="font-medium">{work.numero}</TableCell>
                              <TableCell className="max-w-md">
                                <p className="line-clamp-2">{work.titulo}</p>
                              </TableCell>
                              <TableCell>{work.autor_responsavel}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(work)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(work.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default ApprovedWorksManager;
