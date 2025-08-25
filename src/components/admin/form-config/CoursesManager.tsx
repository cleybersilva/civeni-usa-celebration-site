import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  nome_curso: string;
  created_at: string;
  updated_at: string;
}

interface CourseFormData {
  nome_curso: string;
}

const CoursesManager = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  
  const [formData, setFormData] = useState<CourseFormData>({
    nome_curso: ''
  });

  // Load courses
  React.useEffect(() => {
    loadCourses();
  }, []);

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
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.loadError', 'Erro ao carregar dados'),
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome_curso: ''
    });
    setEditingCourse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_curso.trim()) return;
    
    setLoading(true);
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('cursos')
          .update({
            nome_curso: formData.nome_curso.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCourse.id);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.courseUpdated', 'Curso atualizado')
        });
      } else {
        const { error } = await supabase
          .from('cursos')
          .insert([{
            nome_curso: formData.nome_curso.trim()
          }]);
        
        if (error) throw error;
        
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.courseCreated', 'Curso criado')
        });
      }
      
      await loadCourses();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.saveError', 'Erro ao salvar'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      nome_curso: course.nome_curso
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.formConfig.confirmDelete', 'Tem certeza que deseja excluir?'))) return;
    
    try {
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadCourses();
      toast({
        title: t('admin.formConfig.success', 'Sucesso'),
        description: t('admin.formConfig.courseDeleted', 'Curso excluído')
      });
    } catch (error) {
      console.error('Error deleting course:', error);
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
            {t('admin.formConfig.courses', 'Cursos')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('admin.formConfig.coursesDescription', 'Configure os cursos disponíveis para o evento')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.formConfig.addCourse', 'Adicionar Curso')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCourse 
                  ? t('admin.formConfig.editCourse', 'Editar Curso')
                  : t('admin.formConfig.addCourse', 'Adicionar Curso')
                }
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome_curso">
                  {t('admin.formConfig.courseName', 'Nome do Curso')} *
                </Label>
                <Input
                  id="nome_curso"
                  value={formData.nome_curso}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_curso: e.target.value }))}
                  placeholder={t('admin.formConfig.courseNamePlaceholder', 'Ex: Engenharia de Software')}
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

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {t('admin.formConfig.noCourses', 'Nenhum curso configurado')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.formConfig.coursesList', 'Cursos Configurados')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.formConfig.courseName', 'Nome do Curso')}</TableHead>
                  <TableHead>{t('admin.formConfig.createdAt', 'Criado em')}</TableHead>
                  <TableHead>{t('admin.formConfig.actions', 'Ações')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.nome_curso}</TableCell>
                    <TableCell>
                      {new Date(course.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
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

export default CoursesManager;