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
import { Trash2, Edit, Plus, Upload, Image, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCongressoComite } from '@/hooks/useCongressoComite';
import { useQueryClient } from '@tanstack/react-query';

interface CommitteeMember {
  id?: string;
  nome: string;
  cargo_pt: string;
  instituicao: string;
  foto_url: string;
  categoria: 'organizador' | 'cientifico' | 'avaliacao' | 'apoio_tecnico';
  ordem: number;
  is_active: boolean;
}

const CongressoComiteManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: members, isLoading, refetch } = useCongressoComite();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CommitteeMember>({
    nome: '',
    cargo_pt: '',
    instituicao: '',
    foto_url: '',
    categoria: 'cientifico',
    ordem: 1,
    is_active: true
  });

  const categoriaLabels = {
    organizador: 'Coordenação Geral',
    cientifico: 'Comitê Científico', 
    avaliacao: 'Comitê de Avaliação',
    apoio_tecnico: 'Comitê Operacional'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log('Submitting form data:', formData);
      
      // Prepare data for submission
      const submitData = { ...formData };
      
      if (editingMember) {
        console.log('Updating member:', editingMember.id);
        const { data, error } = await supabase
          .from('congresso_comite')
          .update(submitData)
          .eq('id', editingMember.id)
          .select();

        if (error) throw error;
        console.log('Member updated successfully:', data);

        toast({
          title: 'Sucesso',
          description: 'Membro atualizado com sucesso!'
        });
      } else {
        console.log('Creating new member...');
        const { data, error } = await supabase
          .from('congresso_comite')
          .insert([submitData])
          .select();

        if (error) throw error;
        console.log('Member created successfully:', data);

        toast({
          title: 'Sucesso',
          description: 'Membro adicionado com sucesso!'
        });
      }

      // Force refresh all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['congresso-comite'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'organizador'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'cientifico'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'apoio_tecnico'] }),
        refetch()
      ]);

      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving member:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar membro',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;

    try {
      console.log('Deleting member:', id);
      const { error } = await supabase
        .from('congresso_comite')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Membro excluído com sucesso!'
      });

      // Force refresh all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['congresso-comite'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'organizador'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'cientifico'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'apoio_tecnico'] }),
        refetch()
      ]);
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir membro',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      console.log('Toggling status for member:', id, 'from', currentStatus, 'to', !currentStatus);
      const { error } = await supabase
        .from('congresso_comite')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso!'
      });

      // Force refresh all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['congresso-comite'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'organizador'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'cientifico'] }),
        queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'apoio_tecnico'] }),
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
      instituicao: '',
      foto_url: '',
      categoria: 'cientifico',
      ordem: 1,
      is_active: true
    });
    setEditingMember(null);
  };

  const handleEdit = (member: any) => {
    console.log('Editing member:', member);
    setEditingMember(member);
    setFormData({
      nome: member.nome,
      cargo_pt: member.cargo_pt || '',
      instituicao: member.instituicao,
      foto_url: member.foto_url || '',
      categoria: member.categoria,
      ordem: member.ordem,
      is_active: member.is_active
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
      queryClient.invalidateQueries({ queryKey: ['congresso-comite'] }),
      queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'organizador'] }),
      queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'cientifico'] }),
      queryClient.invalidateQueries({ queryKey: ['congresso-comite', 'apoio_tecnico'] }),
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
      <CardHeader className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <CardTitle className="text-center sm:text-left">Gerenciar Comissão Organizadora</CardTitle>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleRefreshData} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo_pt}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo_pt: e.target.value }))}
                      placeholder="Cargo ou função"
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
                      placeholder="Instituição de origem"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select 
                      value={formData.categoria} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoriaLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ordem">Ordem</Label>
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
                  <Label htmlFor="foto">Foto</Label>
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
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : (editingMember ? 'Atualizar' : 'Adicionar')}
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
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {member.foto_url ? (
                        <img src={member.foto_url} alt={member.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-xs font-bold text-gray-500">
                          {member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{member.nome}</TableCell>
                  <TableCell>{member.cargo_pt || '-'}</TableCell>
                  <TableCell>{member.instituicao}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categoriaLabels[member.categoria]}
                    </Badge>
                  </TableCell>
                  <TableCell>{member.ordem}</TableCell>
                  <TableCell>
                    <Switch
                      checked={member.is_active}
                      onCheckedChange={() => handleToggleStatus(member.id, member.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {(!members || members.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Nenhum membro encontrado. Adicione o primeiro membro.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CongressoComiteManager;