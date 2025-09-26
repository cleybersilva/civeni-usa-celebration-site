import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit, Plus, Upload, Image, RefreshCw, Mail, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCongressoAvaliadores } from '@/hooks/useCongressoAvaliadores';
import { useQueryClient } from '@tanstack/react-query';

interface Avaliador {
  id?: string;
  nome: string;
  cargo_pt: string;
  cargo_en?: string;
  cargo_es?: string;
  instituicao: string;
  foto_url: string;
  categoria: string;
  especialidade?: string;
  email?: string;
  curriculo_url?: string;
  ordem: number;
  is_active: boolean;
}

const CongressoAvaliadoresManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: avaliadores, isLoading, refetch } = useCongressoAvaliadores();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAvaliador, setEditingAvaliador] = useState<Avaliador | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Avaliador>({
    nome: '',
    cargo_pt: '',
    cargo_en: '',
    cargo_es: '',
    instituicao: '',
    foto_url: '',
    categoria: 'avaliador',
    especialidade: '',
    email: '',
    curriculo_url: '',
    ordem: 1,
    is_active: true
  });

  const categoriaOptions = [
    { value: 'avaliador', label: 'Avaliador Principal' },
    { value: 'avaliador_junior', label: 'Avaliador Júnior' },
    { value: 'coordenador_avaliacao', label: 'Coordenador de Avaliação' },
    { value: 'revisor_especialista', label: 'Revisor Especialista' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Submitting form data:', formData);
      
      // Prepare data for submission
      const submitData = { ...formData };
      
      if (editingAvaliador) {
        console.log('Updating avaliador:', editingAvaliador.id);
        const { data, error } = await supabase
          .from('congresso_avaliadores')
          .update(submitData)
          .eq('id', editingAvaliador.id)
          .select();

        if (error) throw error;
        console.log('Avaliador updated successfully:', data);

        toast({
          title: 'Sucesso',
          description: 'Avaliador atualizado com sucesso!'
        });
      } else {
        console.log('Creating new avaliador...');
        const { data, error } = await supabase
          .from('congresso_avaliadores')
          .insert([submitData])
          .select();

        if (error) throw error;
        console.log('Avaliador created successfully:', data);

        toast({
          title: 'Sucesso',
          description: 'Avaliador adicionado com sucesso!'
        });
      }

      // Force refresh all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['congresso-avaliadores'] }),
        refetch()
      ]);

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving avaliador:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar avaliador',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este avaliador?')) return;

    try {
      console.log('Deleting avaliador:', id);
      const { error } = await supabase
        .from('congresso_avaliadores')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Avaliador excluído com sucesso!'
      });

      // Force refresh all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['congresso-avaliadores'] }),
        refetch()
      ]);
    } catch (error: any) {
      console.error('Error deleting avaliador:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir avaliador',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      console.log('Toggling status for avaliador:', id, 'from', currentStatus, 'to', !currentStatus);
      const { error } = await supabase
        .from('congresso_avaliadores')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso!'
      });

      // Force refresh all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['congresso-avaliadores'] }),
        refetch()
      ]);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar status',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cargo_pt: '',
      cargo_en: '',
      cargo_es: '',
      instituicao: '',
      foto_url: '',
      categoria: 'avaliador',
      especialidade: '',
      email: '',
      curriculo_url: '',
      ordem: 1,
      is_active: true
    });
    setEditingAvaliador(null);
  };

  const handleEdit = (avaliador: any) => {
    console.log('Editing avaliador:', avaliador);
    setEditingAvaliador(avaliador);
    setFormData({
      nome: avaliador.nome,
      cargo_pt: avaliador.cargo_pt || '',
      cargo_en: avaliador.cargo_en || '',
      cargo_es: avaliador.cargo_es || '',
      instituicao: avaliador.instituicao,
      foto_url: avaliador.foto_url || '',
      categoria: avaliador.categoria,
      especialidade: avaliador.especialidade || '',
      email: avaliador.email || '',
      curriculo_url: avaliador.curriculo_url || '',
      ordem: avaliador.ordem,
      is_active: avaliador.is_active
    });
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Processing image file:', file.name, file.size);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('Image converted to base64, size:', result.length);
        setFormData(prev => ({ ...prev, foto_url: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefreshData = async () => {
    console.log('Manually refreshing data...');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['congresso-avaliadores'] }),
      refetch()
    ]);
    
    toast({
      title: 'Atualizado',
      description: 'Dados atualizados com sucesso!'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div>Carregando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Avaliadores</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Avaliador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAvaliador ? 'Editar Avaliador' : 'Adicionar Avaliador'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome completo do avaliador"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cargo_pt">Cargo (Português)</Label>
                    <Input
                      id="cargo_pt"
                      value={formData.cargo_pt}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo_pt: e.target.value }))}
                      placeholder="Dr., Profa., etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cargo_en">Cargo (Inglês)</Label>
                    <Input
                      id="cargo_en"
                      value={formData.cargo_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo_en: e.target.value }))}
                      placeholder="Dr., Prof., etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instituicao">Instituição *</Label>
                    <Input
                      id="instituicao"
                      value={formData.instituicao}
                      onChange={(e) => setFormData(prev => ({ ...prev, instituicao: e.target.value }))}
                      placeholder="Universidade, empresa, etc."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriaOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidade">Área de Especialidade</Label>
                  <Textarea
                    id="especialidade"
                    value={formData.especialidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, especialidade: e.target.value }))}
                    placeholder="Descreva as principais áreas de expertise do avaliador"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="curriculo_url">Link do Currículo/CV</Label>
                  <Input
                    id="curriculo_url"
                    type="url"
                    value={formData.curriculo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, curriculo_url: e.target.value }))}
                    placeholder="https://lattes.cnpq.br/..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ordem">Ordem de Exibição</Label>
                    <Input
                      id="ordem"
                      type="number"
                      value={formData.ordem}
                      onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                  
                  <div className="space-y-2 flex items-center gap-2 pt-6">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label>Ativo</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="foto">Foto do Avaliador</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    {formData.foto_url && (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {formData.foto_url.startsWith('data:') ? (
                          <img src={formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : formData.foto_url ? (
                          <img src={formData.foto_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : (editingAvaliador ? 'Atualizar' : 'Adicionar')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {avaliadores?.map((avaliador) => (
                <TableRow key={avaliador.id}>
                  <TableCell>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {avaliador.foto_url ? (
                        <img src={avaliador.foto_url} alt={avaliador.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs font-bold text-gray-500">
                          {avaliador.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{avaliador.nome}</TableCell>
                  <TableCell>{avaliador.cargo_pt || '-'}</TableCell>
                  <TableCell>{avaliador.instituicao}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categoriaOptions.find(cat => cat.value === avaliador.categoria)?.label || avaliador.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {avaliador.especialidade ? (
                      <span className="text-sm text-gray-600 line-clamp-2">
                        {avaliador.especialidade.slice(0, 50)}
                        {avaliador.especialidade.length > 50 ? '...' : ''}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {avaliador.email && (
                        <a href={`mailto:${avaliador.email}`} className="text-blue-600 hover:text-blue-800">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {avaliador.curriculo_url && (
                        <a href={avaliador.curriculo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{avaliador.ordem}</TableCell>
                  <TableCell>
                    <Switch
                      checked={avaliador.is_active}
                      onCheckedChange={() => handleToggleStatus(avaliador.id, avaliador.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(avaliador)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(avaliador.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(!avaliadores || avaliadores.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Nenhum avaliador encontrado. Adicione o primeiro avaliador.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CongressoAvaliadoresManager;