import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Class {
  id: string;
  id_curso: string;
  nome_turma: string;
  created_at: string;
  updated_at: string;
  curso?: {
    nome_curso: string;
  };
}

interface Course {
  id: string;
  nome_curso: string;
}

interface ClassFormData {
  id_curso: string;
  nome_turma: string;
}

const ClassesManager = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [formData, setFormData] = useState<ClassFormData>({
    id_curso: '',
    nome_turma: ''
  });

  // Load data
  React.useEffect(() => {
    loadClasses();
    loadCourses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          *,
          curso:cursos(nome_curso)
        `)
        .order('nome_turma', { ascending: true });
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.loadError', 'Erro ao carregar dados'),
        variant: 'destructive'
      });
    }
  };

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('nome_curso', { ascending: true });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      id_curso: '',
      nome_turma: ''
    });
    setEditingClass(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_curso || !formData.nome_turma.trim()) return;
    
    setLoading(true);
    try {
      if (editingClass) {
        const { error } = await supabase
          .from('turmas')
          .update({
            id_curso: formData.id_curso,
            nome_turma: formData.nome_turma.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClass.id);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.classUpdated', 'Turma atualizada')
        });
      } else {
        const { error } = await supabase
          .from('turmas')
          .insert([{
            id_curso: formData.id_curso,
            nome_turma: formData.nome_turma.trim()
          }]);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.classCreated', 'Turma criada')
        });
      }
      
      await loadClasses();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.saveError', 'Erro ao salvar'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setFormData({
      id_curso: classItem.id_curso,
      nome_turma: classItem.nome_turma
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.formConfig.confirmDelete', 'Tem certeza que deseja excluir?'))) return;
    
    try {
      const { error } = await supabase
        .from('turmas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadClasses();
      toast({
        title: t('admin.formConfig.success', 'Sucesso'),
        description: t('admin.formConfig.classDeleted', 'Turma excluída')
      });
    } catch (error) {
      console.error('Error deleting class:', error);
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
            {t('admin.formConfig.classes', 'Turmas')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('admin.formConfig.classesDescription', 'Configure as turmas vinculadas aos cursos')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.formConfig.addClass', 'Adicionar Turma')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass 
                  ? t('admin.formConfig.editClass', 'Editar Turma')
                  : t('admin.formConfig.addClass', 'Adicionar Turma')
                }
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="id_curso">
                  {t('admin.formConfig.course', 'Curso')} *
                </Label>
                <Select value={formData.id_curso} onValueChange={(value) => setFormData(prev => ({ ...prev, id_curso: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.formConfig.selectCourse', 'Selecione um curso')} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.nome_curso}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nome_turma">
                  {t('admin.formConfig.className', 'Nome da Turma')} *
                </Label>
                <Input
                  id="nome_turma"
                  value={formData.nome_turma}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_turma: e.target.value }))}
                  placeholder={t('admin.formConfig.classNamePlaceholder', 'Ex: Turma A, Turma Manhã')}
                  required
                />
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

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {t('admin.formConfig.noClasses', 'Nenhuma turma configurada')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.formConfig.classesList', 'Turmas Configuradas')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.formConfig.className', 'Nome da Turma')}</TableHead>
                  <TableHead>{t('admin.formConfig.course', 'Curso')}</TableHead>
                  <TableHead>{t('admin.formConfig.createdAt', 'Criado em')}</TableHead>
                  <TableHead>{t('admin.formConfig.actions', 'Ações')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.nome_turma}</TableCell>
                    <TableCell>{classItem.curso?.nome_curso || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(classItem.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(classItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(classItem.id)}
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

export default ClassesManager;