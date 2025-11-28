import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, DollarSign, Calendar } from 'lucide-react';
import { useEventCategories } from '@/hooks/useEventCategories';
import { CategoryFormDialog } from './CategoryFormDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EventCategoriesManager = () => {
  const { categories, loading, deleteCategory, syncWithStripe } = useEventCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleOpenDialog = (category = null) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      const result = await deleteCategory(id);
      if (result.success) {
        toast.success('Categoria excluída com sucesso');
      } else {
        toast.error('Erro ao excluir categoria');
      }
    }
  };

  const handleSync = async (id: string) => {
    const result = await syncWithStripe(id);
    if (result.success) {
      toast.success('Sincronização com Stripe realizada');
    } else {
      toast.error('Erro na sincronização com Stripe');
    }
  };

  if (loading) {
    return <div className="p-6">Carregando categorias...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
            Categorias de Evento
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie as categorias de evento com preços e configurações
          </p>
        </div>
        
        <Button onClick={() => handleOpenDialog()} className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Moeda</TableHead>
              <TableHead>Disponibilidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Promocional</TableHead>
              <TableHead>Sync</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.title_pt}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {category.slug}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {category.is_free ? (
                      <span className="text-green-600 font-medium">Gratuito</span>
                    ) : (
                      <span>{((category.price_cents || 0) / 100).toFixed(2)}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{category.currency}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    {category.available_from && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>De: {format(new Date(category.available_from), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                    {category.available_until && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Até: {format(new Date(category.available_until), 'dd/MM/yyyy')}</span>
                      </div>
                    )}
                    {!category.available_from && !category.available_until && (
                      <span className="text-gray-500">Sempre disponível</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                    {category.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={category.is_promotional ? 'destructive' : 'outline'}>
                    {category.is_promotional ? 'Promocional' : 'Normal'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant={
                      category.sync_status === 'synced' ? 'default' : 
                      category.sync_status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {category.sync_status === 'synced' ? 'Sincronizado' :
                       category.sync_status === 'pending' ? 'Pendente' : 'Erro'}
                    </Badge>
                    {!category.is_free && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(category.id)}
                        className="text-xs"
                      >
                        Resync
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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

        {categories.length === 0 && (
          <div className="text-center py-8">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma categoria cadastrada</p>
          </div>
        )}
      </div>

      <CategoryFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        category={editingCategory}
      />
    </div>
  );
};

export default EventCategoriesManager;