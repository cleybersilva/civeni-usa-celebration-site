import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Wand2 } from 'lucide-react';
import { useParticipantTypes } from '@/hooks/useParticipantTypes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ParticipantType {
  id: string;
  type_name: string;
  description: string | null;
  requires_course_selection: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ParticipantTypesManager = () => {
  const { participantTypes, loading, createParticipantType, updateParticipantType, deleteParticipantType, refreshParticipantTypes } = useParticipantTypes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ParticipantType | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [formData, setFormData] = useState({
    type_name: '',
    description: '',
    requires_course_selection: false,
    is_active: true,
  });

  const handleSetupSorteados = async () => {
    setSetupLoading(true);
    try {
      // Verificar se "Sorteados" já existe
      const { data: existingType } = await supabase
        .from('participant_types')
        .select('*')
        .eq('type_name', 'Sorteados')
        .single();

      let sorteadosCreated = false;

      if (!existingType) {
        // Criar o tipo "Sorteados"
        const { error: typeError } = await supabase
          .from('participant_types')
          .insert({
            type_name: 'Sorteados',
            description: 'Participantes sorteados com 100% de desconto',
            requires_course_selection: false,
            is_active: true
          });

        if (typeError) throw typeError;
        sorteadosCreated = true;
      }

      // Atualizar o cupom CIVENI2025FREE
      const { error: couponError } = await supabase
        .from('coupon_codes')
        .update({
          participant_type: 'Professor(a),Palestrantes,Sorteados',
          description: 'Cupom de 100% de desconto para Professor(a), Palestrantes e Sorteados',
          updated_at: new Date().toISOString()
        })
        .eq('code', 'CIVENI2025FREE');

      if (couponError) throw couponError;

      // Atualizar a lista
      await refreshParticipantTypes();

      if (sorteadosCreated) {
        toast.success('Tipo "Sorteados" criado e cupom CIVENI2025FREE atualizado com sucesso!');
      } else {
        toast.success('Tipo "Sorteados" já existia. Cupom CIVENI2025FREE atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao configurar Sorteados:', error);
      toast.error('Erro ao configurar tipo Sorteados');
    } finally {
      setSetupLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type_name: '',
      description: '',
      requires_course_selection: false,
      is_active: true,
    });
    setEditingType(null);
  };

  const handleOpenDialog = (type?: ParticipantType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        type_name: type.type_name,
        description: type.description || '',
        requires_course_selection: type.requires_course_selection,
        is_active: type.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingType) {
        const result = await updateParticipantType(editingType.id, formData);
        if (result.success) {
          toast.success('Tipo de participante atualizado com sucesso');
          handleCloseDialog();
        } else {
          toast.error('Erro ao atualizar tipo de participante');
        }
      } else {
        const result = await createParticipantType(formData);
        if (result.success) {
          toast.success('Tipo de participante criado com sucesso');
          handleCloseDialog();
        } else {
          toast.error('Erro ao criar tipo de participante');
        }
      }
    } catch (error) {
      toast.error('Erro ao salvar tipo de participante');
      console.error('Error saving participant type:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tipo de participante?')) {
      const result = await deleteParticipantType(id);
      if (result.success) {
        toast.success('Tipo de participante excluído com sucesso');
      } else {
        toast.error('Erro ao excluir tipo de participante');
      }
    }
  };

  if (loading) {
    return <div className="p-6">Carregando tipos de participante...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Tipos de Participante
          </h2>
          <p className="text-gray-600 mt-1">
            Gerencie os tipos de participante disponíveis para inscrição
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSetupSorteados} 
            disabled={setupLoading}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            {setupLoading ? 'Configurando...' : 'Setup Sorteados'}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo de Participante' : 'Novo Tipo de Participante'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type_name">Nome do Tipo *</Label>
                <Input
                  id="type_name"
                  value={formData.type_name}
                  onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                  placeholder="Ex: Aluno(a) VCCU"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do tipo de participante"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_course_selection"
                  checked={formData.requires_course_selection}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_course_selection: checked })}
                />
                <Label htmlFor="requires_course_selection">Requer seleção de curso</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Salvando...' : (editingType ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Requer Curso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participantTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.type_name}</TableCell>
                <TableCell>{type.description || '-'}</TableCell>
                <TableCell>
                  <Badge variant={type.requires_course_selection ? 'default' : 'secondary'}>
                    {type.requires_course_selection ? 'Sim' : 'Não'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={type.is_active ? 'default' : 'secondary'}>
                    {type.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(type)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {participantTypes.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum tipo de participante cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantTypesManager;