import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRegistrationCategories } from '@/hooks/useRegistrationCategories';

const CategoriesManager = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useRegistrationCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    category_name: '',
    price_brl: 0,
    requires_proof: false,
    is_exempt: false,
    batch_id: null
  });

  const resetForm = () => {
    setFormData({
      category_name: '',
      price_brl: 0,
      requires_proof: false,
      is_exempt: false,
      batch_id: null
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_name.trim()) return;
    
    setFormLoading(true);
    try {
      let result;
      if (editingCategory) {
        result = await updateCategory(editingCategory.id, formData);
      } else {
        result = await createCategory(formData);
      }
      
      if (result.success) {
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: editingCategory 
            ? t('admin.formConfig.categoryUpdated', 'Categoria atualizada')
            : t('admin.formConfig.categoryCreated', 'Categoria criada')
        });
        setIsDialogOpen(false);
        resetForm();
      } else {
        throw new Error('Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.saveError', 'Erro ao salvar'),
        variant: 'destructive'
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      price_brl: category.price_brl,
      requires_proof: category.requires_proof,
      is_exempt: category.is_exempt,
      batch_id: category.batch_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.formConfig.confirmDelete', 'Tem certeza que deseja excluir?'))) return;
    
    try {
      const result = await deleteCategory(id);
      if (result.success) {
        toast({
          title: t('admin.formConfig.success', 'Sucesso'),
          description: t('admin.formConfig.categoryDeleted', 'Categoria excluída')
        });
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: t('admin.formConfig.error', 'Erro'),
        description: t('admin.formConfig.deleteError', 'Erro ao excluir'),
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {t('admin.formConfig.loading', 'Carregando...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {t('admin.formConfig.categories', 'Categorias')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('admin.formConfig.categoriesDescription', 'Configure as categorias de participação e seus valores')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.formConfig.addCategory', 'Adicionar Categoria')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory 
                  ? t('admin.formConfig.editCategory', 'Editar Categoria')
                  : t('admin.formConfig.addCategory', 'Adicionar Categoria')
                }
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category_name">
                  {t('admin.formConfig.categoryName', 'Nome da Categoria')} *
                </Label>
                <Input
                  id="category_name"
                  value={formData.category_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                  placeholder={t('admin.formConfig.categoryNamePlaceholder', 'Ex: Estudante, Profissional')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price_brl">
                  {t('admin.formConfig.price', 'Preço (R$)')}
                </Label>
                <Input
                  id="price_brl"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_brl}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_brl: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_proof"
                  checked={formData.requires_proof}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_proof: checked }))}
                />
                <Label htmlFor="requires_proof">
                  {t('admin.formConfig.requiresProof', 'Requer comprovação')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_exempt"
                  checked={formData.is_exempt}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_exempt: checked }))}
                />
                <Label htmlFor="is_exempt">
                  {t('admin.formConfig.isExempt', 'Inscrição gratuita')}
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('admin.formConfig.cancel', 'Cancelar')}
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? t('admin.formConfig.saving', 'Salvando...') : t('admin.formConfig.save', 'Salvar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {t('admin.formConfig.noCategories', 'Nenhuma categoria configurada')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.formConfig.categoriesList', 'Categorias Configuradas')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.formConfig.categoryName', 'Nome')}</TableHead>
                  <TableHead>{t('admin.formConfig.price', 'Preço')}</TableHead>
                  <TableHead>{t('admin.formConfig.requiresProof', 'Requer Comprovação')}</TableHead>
                  <TableHead>{t('admin.formConfig.isExempt', 'Gratuita')}</TableHead>
                  <TableHead>{t('admin.formConfig.actions', 'Ações')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.category_name}</TableCell>
                    <TableCell>{formatCurrency(category.price_brl)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.requires_proof 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.requires_proof 
                          ? t('admin.formConfig.yes', 'Sim')
                          : t('admin.formConfig.no', 'Não')
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_exempt 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {category.is_exempt 
                          ? t('admin.formConfig.yes', 'Sim')
                          : t('admin.formConfig.no', 'Não')
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
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

export default CategoriesManager;