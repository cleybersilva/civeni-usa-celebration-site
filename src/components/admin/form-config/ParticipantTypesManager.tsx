import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ParticipantType {
  id: string;
  type_name: string;
  description: string;
  requires_course_selection: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ParticipantTypeFormData {
  type_name: string;
  description: string;
  requires_course_selection: boolean;
  is_active: boolean;
}

const ParticipantTypesManager = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ParticipantType | null>(null);
  const [loading, setLoading] = useState(false);
  const [participantTypes, setParticipantTypes] = useState<ParticipantType[]>([]);
  
  const [formData, setFormData] = useState<ParticipantTypeFormData>({
    type_name: '',
    description: '',
    requires_course_selection: false,
    is_active: true
  });

  // Load participant types
  React.useEffect(() => {
    loadParticipantTypes();
  }, []);

  const loadParticipantTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('participant_types')
        .select('*')
        .order('type_name', { ascending: true });
      
      if (error) throw error;
      setParticipantTypes(data || []);
    } catch (error) {
      console.error('Error loading participant types:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.loadError', 'Erro ao carregar dados'),
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type_name: '',
      description: '',
      requires_course_selection: false,
      is_active: true
    });
    setEditingType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type_name.trim()) return;
    
    setLoading(true);
    try {
      if (editingType) {
        const { error } = await supabase
          .from('participant_types')
          .update({
            type_name: formData.type_name.trim(),
            description: formData.description.trim(),
            requires_course_selection: formData.requires_course_selection,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingType.id);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.participantTypeUpdated', 'Tipo de participante atualizado')
        });
      } else {
        const { error } = await supabase
          .from('participant_types')
          .insert([{
            type_name: formData.type_name.trim(),
            description: formData.description.trim(),
            requires_course_selection: formData.requires_course_selection,
            is_active: formData.is_active
          }]);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.participantTypeCreated', 'Tipo de participante criado')
        });
      }
      
      await loadParticipantTypes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving participant type:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.saveError', 'Erro ao salvar'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: ParticipantType) => {
    setEditingType(type);
    setFormData({
      type_name: type.type_name,
      description: type.description,
      requires_course_selection: type.requires_course_selection,
      is_active: type.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.formConfig.confirmDelete', 'Tem certeza que deseja excluir?'))) return;
    
    try {
      const { error } = await supabase
        .from('participant_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadParticipantTypes();
      toast({
        title: t('admin.formConfig.success', 'Sucesso'),
        description: t('admin.formConfig.participantTypeDeleted', 'Tipo de participante excluído')
      });
    } catch (error) {
      console.error('Error deleting participant type:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.deleteError', 'Erro ao excluir'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {t('admin.formConfig.participantTypes', 'Tipos de Participantes')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('admin.formConfig.participantTypesDescription', 'Configure os diferentes tipos de participantes do evento')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.formConfig.addParticipantType', 'Adicionar Tipo')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType 
                  ? t('admin.formConfig.editParticipantType', 'Editar Tipo de Participante')
                  : t('admin.formConfig.addParticipantType', 'Adicionar Tipo de Participante')
                }
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type_name">
                  {t('admin.formConfig.typeName', 'Nome do Tipo')} *
                </Label>
                <Input
                  id="type_name"
                  value={formData.type_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, type_name: e.target.value }))}
                  placeholder={t('admin.formConfig.typeNamePlaceholder', 'Ex: Aluno, Professor, Pesquisador')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">
                  {t('admin.formConfig.description', 'Descrição')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('admin.formConfig.descriptionPlaceholder', 'Descreva as características deste tipo')}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_course_selection"
                  checked={formData.requires_course_selection}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_course_selection: checked }))}
                />
                <Label htmlFor="requires_course_selection">
                  {t('admin.formConfig.requiresCourseSelection', 'Requer seleção de curso')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">
                  {t('admin.formConfig.isActive', 'Ativo')}
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('admin.formConfig.cancel', 'Cancelar')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t('admin.formConfig.saving', 'Salvando...') : t('admin.formConfig.save', 'Salvar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {participantTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {t('admin.formConfig.noParticipantTypes', 'Nenhum tipo de participante configurado')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.formConfig.participantTypesList', 'Tipos Configurados')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.formConfig.typeName', 'Nome')}</TableHead>
                  <TableHead>{t('admin.formConfig.description', 'Descrição')}</TableHead>
                  <TableHead>{t('admin.formConfig.requiresCourse', 'Requer Curso')}</TableHead>
                  <TableHead>{t('admin.formConfig.status', 'Status')}</TableHead>
                  <TableHead>{t('admin.formConfig.actions', 'Ações')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.type_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{type.description}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.requires_course_selection 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.requires_course_selection 
                          ? t('admin.formConfig.yes', 'Sim')
                          : t('admin.formConfig.no', 'Não')
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {type.is_active 
                          ? t('admin.formConfig.active', 'Ativo')
                          : t('admin.formConfig.inactive', 'Inativo')
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParticipantTypesManager;