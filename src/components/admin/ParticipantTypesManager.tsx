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
import { useAdminAuth } from '@/hooks/useAdminAuth';
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

interface SetupSorteadosResponse {
  success: boolean;
  message?: string;
  error?: string;
  sorteados_id?: string;
  created?: boolean;
}

const ParticipantTypesManager = () => {
  const { participantTypes, loading, createParticipantType, updateParticipantType, deleteParticipantType, refreshParticipantTypes } = useParticipantTypes();
  const { user, sessionToken } = useAdminAuth();
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
      // Verificar se o usuário está autenticado
      if (!user || !sessionToken) {
        throw new Error('Usuário não autenticado. Por favor, faça login novamente.');
      }

      // Chamar a função RPC segura do banco de dados com autenticação
      const { data, error } = await supabase.rpc('setup_sorteados_type', {
        user_email: user.email,
        session_token: sessionToken
      });

      if (error) {
        console.error('Erro RPC:', error);
        throw new Error(error.message || 'Erro ao configurar tipo Sorteados');
      }

      if (!data) {
        throw new Error('Nenhuma resposta recebida do servidor');
      }

      // Type assertion para a resposta
      const response = data as unknown as SetupSorteadosResponse;

      if (!response.success) {
        throw new Error(response.error || 'Erro desconhecido ao configurar tipo Sorteados');
      }

      // Atualizar a lista de tipos
      await refreshParticipantTypes();

      // Mostrar mensagem de sucesso
      toast.success(response.message || 'Configuração concluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao configurar Sorteados:', error);
      toast.error(error.message || 'Erro ao configurar tipo Sorteados');
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
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            Tipos de Participante
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie os tipos de participante disponíveis para inscrição
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleSetupSorteados} 
            disabled={setupLoading}
            variant="secondary"
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Wand2 className="w-4 h-4" />
            {setupLoading ? 'Configurando...' : 'Setup Sorteados'}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="flex items-center justify-center gap-2 w-full sm:w-auto">
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