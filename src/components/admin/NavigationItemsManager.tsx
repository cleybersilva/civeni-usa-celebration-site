import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight, Lock, Unlock, Menu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigationItems, NavigationItem } from '@/hooks/useNavigationItems';
import { NavigationItemFormDialog } from './NavigationItemFormDialog';
import { cn } from '@/lib/utils';

export function NavigationItemsManager() {
  const {
    items,
    menus,
    isLoading,
    upsertItem,
    deleteItem,
    toggleVisibility,
    toggleStatus,
    isUpserting,
    isDeleting,
  } = useNavigationItems();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NavigationItem | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'menu' | 'submenu'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibleFilter, setVisibleFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (visibleFilter === 'visible' && !item.is_visible) return false;
      if (visibleFilter === 'hidden' && item.is_visible) return false;
      return true;
    });
  }, [items, typeFilter, statusFilter, visibleFilter]);

  // Group items by menu for display
  const organizedItems = useMemo(() => {
    const menuItems = filteredItems.filter((i) => i.type === 'menu');
    const result: (NavigationItem & { isSubmenu?: boolean })[] = [];

    menuItems.forEach((menu) => {
      result.push(menu);
      const submenus = filteredItems
        .filter((i) => i.type === 'submenu' && i.parent_id === menu.id)
        .sort((a, b) => a.order_index - b.order_index);
      submenus.forEach((sub) => {
        result.push({ ...sub, isSubmenu: true });
      });
    });

    // Add orphan submenus (whose parent was filtered out)
    const orphanSubmenus = filteredItems.filter(
      (i) => i.type === 'submenu' && !menuItems.find((m) => m.id === i.parent_id)
    );
    orphanSubmenus.forEach((sub) => {
      result.push({ ...sub, isSubmenu: true });
    });

    return result;
  }, [filteredItems]);

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: NavigationItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = menus.find((m) => m.id === parentId);
    return parent?.label_pt_br || '-';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Carregando itens de navegação...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Menu className="h-5 w-5" />
            Gerenciar Menu/Submenu
          </CardTitle>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tipo:</span>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="menu">Menus</SelectItem>
                  <SelectItem value="submenu">Submenus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Visível:</span>
              <Select value={visibleFilter} onValueChange={(v) => setVisibleFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="visible">Visíveis</SelectItem>
                  <SelectItem value="hidden">Ocultos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome (PT-BR)</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Menu Pai</TableHead>
                  <TableHead className="text-center">Ordem</TableHead>
                  <TableHead className="text-center">Visível</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Restrito</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum item de navegação encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  organizedItems.map((item) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        (item as any).isSubmenu && 'bg-muted/30'
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {(item as any).isSubmenu && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground ml-4" />
                          )}
                          {item.label_pt_br}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'menu' ? 'default' : 'secondary'}>
                          {item.type === 'menu' ? 'Menu' : 'Submenu'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getParentName(item.parent_id)}
                      </TableCell>
                      <TableCell className="text-center">{item.order_index}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleVisibility(item)}
                          title={item.is_visible ? 'Ocultar' : 'Mostrar'}
                        >
                          {item.is_visible ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleStatus(item)}
                          title={item.status === 'active' ? 'Desativar' : 'Ativar'}
                          className={item.status === 'active' ? 'text-green-600' : 'text-muted-foreground'}
                        >
                          {item.status === 'active' ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.restricted_to_registered ? (
                          <Lock className="h-4 w-4 text-amber-600 mx-auto" />
                        ) : (
                          <Unlock className="h-4 w-4 text-muted-foreground mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(item)}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <NavigationItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        menus={menus}
        onSubmit={async (data) => { await upsertItem(data); }}
        isSubmitting={isUpserting}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item "{itemToDelete?.label_pt_br}"?
              {itemToDelete?.type === 'menu' && (
                <span className="block mt-2 text-amber-600">
                  Atenção: Todos os submenus vinculados a este menu também serão excluídos.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
