import { useState, useRef } from 'react';
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
import { Plus, Pencil, Trash2, FileText, Search, Upload, Download, FileSpreadsheet } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import * as XLSX from 'xlsx';

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

interface ImportedWork {
  numero: number;
  titulo: string;
  autor_responsavel: string;
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
  
  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importArea, setImportArea] = useState<string>('');
  const [importedData, setImportedData] = useState<ImportedWork[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // === IMPORT FUNCTIONS ===
  const handleOpenImport = (area: string) => {
    setImportArea(area);
    setImportedData([]);
    setIsImportDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        // Map columns - support various column name formats
        const mappedData: ImportedWork[] = jsonData.map((row) => {
          const numero = row['Nº'] || row['N°'] || row['Numero'] || row['NUMERO'] || row['numero'] || row['N'] || 0;
          const titulo = row['Título'] || row['TÍTULO'] || row['Titulo'] || row['TITULO'] || row['titulo'] || '';
          const autor = row['Autor Responsável'] || row['AUTOR RESPONSÁVEL'] || row['Autor'] || row['AUTOR'] || row['autor_responsavel'] || row['autor'] || '';

          return {
            numero: typeof numero === 'number' ? numero : parseInt(String(numero)) || 0,
            titulo: String(titulo).trim(),
            autor_responsavel: String(autor).trim(),
          };
        }).filter(item => item.numero > 0 && item.titulo && item.autor_responsavel);

        if (mappedData.length === 0) {
          toast.error('Nenhum dado válido encontrado. Verifique se as colunas estão corretas: Nº, Título, Autor Responsável');
          return;
        }

        setImportedData(mappedData);
        toast.success(`${mappedData.length} artigos encontrados para importação`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Erro ao ler o arquivo. Verifique se é um arquivo Excel válido.');
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (importedData.length === 0 || !importArea) return;

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const { email, token } = getAdminSession();

      for (const item of importedData) {
        try {
          const { error } = await supabase.rpc('admin_upsert_approved_work', {
            work_data: {
              area: importArea,
              numero: item.numero,
              titulo: item.titulo,
              autor_responsavel: item.autor_responsavel,
              observacoes: '',
            } as any,
            user_email: email,
            session_token: token,
          });

          if (error) {
            console.error('Import error for item:', item, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Import error for item:', item, err);
          errorCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['approved-works'] });

      if (errorCount === 0) {
        toast.success(`${successCount} artigos importados com sucesso!`);
      } else {
        toast.warning(`${successCount} importados, ${errorCount} com erro`);
      }

      setIsImportDialogOpen(false);
      setImportedData([]);
    } catch (error: any) {
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { 'Nº': 1, 'Título': 'Exemplo de título do artigo', 'Autor Responsável': 'Nome do Autor' },
      { 'Nº': 2, 'Título': 'Outro título de exemplo', 'Autor Responsável': 'Outro Autor' },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Artigos');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 5 },   // Nº
      { wch: 50 },  // Título
      { wch: 30 },  // Autor Responsável
    ];

    XLSX.writeFile(wb, 'modelo_importacao_artigos.xlsx');
    toast.success('Modelo Excel baixado!');
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
                <div className={`px-4 py-3 ${getAreaBadgeColor(area)} text-white flex items-center gap-3 flex-wrap`}>
                  <AccordionTrigger className="flex-1 hover:no-underline p-0 [&>svg]:text-white">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      <span className="font-semibold">ÁREA: {area}</span>
                      <Badge variant="secondary" className="ml-2">
                        {areaWorks.length} artigos
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenImport(area)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Importar
                  </Button>
                </div>
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Importar Artigos - {importArea}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <Card className="p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Instruções:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Faça upload de um arquivo Excel (.xlsx) com as colunas: <strong>Nº, Título, Autor Responsável</strong></li>
                <li>• Artigos com mesmo número serão atualizados</li>
                <li>• Linhas sem dados válidos serão ignoradas</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={downloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Modelo Excel
              </Button>
            </Card>

            {/* File Upload */}
            <div>
              <Label htmlFor="import-file">Arquivo Excel</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>

            {/* Preview */}
            {importedData.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Preview ({importedData.length} artigos)</h4>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Nº</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Autor Responsável</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedData.slice(0, 20).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.numero}</TableCell>
                          <TableCell className="max-w-xs truncate">{item.titulo}</TableCell>
                          <TableCell>{item.autor_responsavel}</TableCell>
                        </TableRow>
                      ))}
                      {importedData.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            ... e mais {importedData.length - 20} artigos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setImportedData([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImportConfirm}
                disabled={importedData.length === 0 || isImporting}
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar {importedData.length} artigos
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovedWorksManager;
