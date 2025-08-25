import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Archive, RefreshCw, GripVertical, Eye } from 'lucide-react';
import { useEventCategories } from '@/hooks/useEventCategories';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { CategoryFormDialog } from './CategoryFormDialog';

const ConfiguredCategoriesManager = () => {
  const { categories, loading, updateCategory, syncWithStripe } = useEventCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const formatPrice = (category: any) => {
    if (category.is_free) return 'Gratuito';
    return `${category.currency} ${(category.price_cents / 100).toFixed(2)}`;
  };

  const getSyncStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'error':
        return <Badge variant="destructive" title={error}>Erro</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const handleSync = async (categoryId: string) => {
    setSyncing(categoryId);
    try {
      const result = await syncWithStripe(categoryId);
      if (result.success) {
        toast.success('Categoria sincronizada com Stripe');
      } else {
        toast.error('Erro ao sincronizar categoria');
      }
    } finally {
      setSyncing(null);
    }
  };

  const handleToggleActive = async (category: any) => {
    try {
      const result = await updateCategory(category.id, {
        is_active: !category.is_active
      });
      
      if (result.success) {
        toast.success(`Categoria ${!category.is_active ? 'ativada' : 'desativada'}`);
      } else {
        toast.error('Erro ao atualizar categoria');
      }
    } catch (error) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categorias Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Carregando categorias...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Categorias Configuradas</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as categorias de inscrição e sincronize com o Stripe
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </CardHeader>
      
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma categoria configurada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sincronização</TableHead>
                  <TableHead>Disponibilidade</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.order_index}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{category.title_pt}</p>
                        <p className="text-sm text-muted-foreground">{category.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(category)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.is_active}
                          onCheckedChange={() => handleToggleActive(category)}
                        />
                        <span className="text-sm">
                          {category.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSyncStatusBadge(category.sync_status, category.sync_error)}
                        {!category.is_free && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(category.id)}
                            disabled={syncing === category.id}
                          >
                            {syncing === category.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {category.available_from && (
                          <div>De: {new Date(category.available_from).toLocaleDateString()}</div>
                        )}
                        {category.available_until && (
                          <div>Até: {new Date(category.available_until).toLocaleDateString()}</div>
                        )}
                        {!category.available_from && !category.available_until && (
                          <span className="text-muted-foreground">Sempre disponível</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(category.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(category)}
                        >
                          {category.is_active ? <Archive className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CategoryFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        category={editingCategory}
      />
    </Card>
  );
};

export default ConfiguredCategoriesManager;