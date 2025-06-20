
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useRegistrationCategories, RegistrationCategory } from '@/hooks/useRegistrationCategories';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const RegistrationManager = () => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useRegistrationCategories();
  const [editingCategory, setEditingCategory] = useState<RegistrationCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    category_name: '',
    price_brl: '',
    requires_proof: false,
    is_exempt: false
  });

  const resetForm = () => {
    setFormData({
      category_name: '',
      price_brl: '',
      requires_proof: false,
      is_exempt: false
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const categoryData = {
      category_name: formData.category_name,
      price_brl: parseFloat(formData.price_brl),
      requires_proof: formData.requires_proof,
      is_exempt: formData.is_exempt,
      batch_id: null
    };

    let result;
    if (editingCategory) {
      result = await updateCategory(editingCategory.id, categoryData);
    } else {
      result = await createCategory(categoryData);
    }

    if (result.success) {
      setIsDialogOpen(false);
      resetForm();
      alert(editingCategory ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
    } else {
      alert('Erro ao salvar categoria. Tente novamente.');
    }
  };

  const handleEdit = (category: RegistrationCategory) => {
    setEditingCategory(category);
    setFormData({
      category_name: category.category_name,
      price_brl: category.price_brl.toString(),
      requires_proof: category.requires_proof,
      is_exempt: category.is_exempt
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      const result = await deleteCategory(categoryId);
      if (result.success) {
        alert('Categoria excluída com sucesso!');
      } else {
        alert('Erro ao excluir categoria. Tente novamente.');
      }
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Carregando categorias...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Categorias de Inscrição</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category_name" className="block text-sm font-medium mb-2">
                  Nome da Categoria
                </Label>
                <Input
                  id="category_name"
                  value={formData.category_name}
                  onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price_brl" className="block text-sm font-medium mb-2">
                  Preço (R$)
                </Label>
                <Input
                  id="price_brl"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_brl}
                  onChange={(e) => setFormData({...formData, price_brl: e.target.value})}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_proof"
                  checked={formData.requires_proof}
                  onCheckedChange={(checked) => setFormData({...formData, requires_proof: checked})}
                />
                <Label htmlFor="requires_proof" className="text-sm font-medium">
                  Requer comprovação
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_exempt"
                  checked={formData.is_exempt}
                  onCheckedChange={(checked) => setFormData({...formData, is_exempt: checked})}
                />
                <Label htmlFor="is_exempt" className="text-sm font-medium">
                  Categoria isenta
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                  {editingCategory ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias de Inscrição ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma categoria cadastrada. Clique em "Adicionar Categoria" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Requer Comprovação</TableHead>
                  <TableHead>Isenta</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.category_name}
                    </TableCell>
                    <TableCell>
                      {category.is_exempt ? (
                        <span className="text-green-600 font-semibold">GRATUITO</span>
                      ) : (
                        formatCurrency(category.price_brl)
                      )}
                    </TableCell>
                    <TableCell>
                      {category.requires_proof ? (
                        <span className="text-blue-600">Sim</span>
                      ) : (
                        <span className="text-gray-500">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.is_exempt ? (
                        <span className="text-green-600">Sim</span>
                      ) : (
                        <span className="text-gray-500">Não</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationManager;
