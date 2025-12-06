import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NavigationItem {
  id: string;
  type: 'menu' | 'submenu';
  parent_id: string | null;
  slug: string;
  path: string;
  order_index: number;
  is_visible: boolean;
  status: 'active' | 'inactive';
  restricted_to_registered: boolean;
  label_pt_br: string;
  label_en: string | null;
  label_es: string | null;
  label_tr: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  // Computed field for submenus
  children?: NavigationItem[];
}

export interface NavigationItemFormData {
  id?: string;
  type: 'menu' | 'submenu';
  parent_id: string | null;
  slug: string;
  path: string;
  order_index: number;
  is_visible: boolean;
  status: 'active' | 'inactive';
  restricted_to_registered: boolean;
  label_pt_br: string;
  label_en: string;
  label_es: string;
  label_tr: string;
  icon: string;
}

export function useNavigationItems() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all navigation items
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['navigation-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .order('type', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as NavigationItem[];
    },
  });

  // Get menus only (for parent selection dropdown)
  const menus = items.filter(item => item.type === 'menu');

  // Get items with their children organized
  const getOrganizedItems = useCallback(() => {
    const menuItems = items.filter(item => item.type === 'menu');
    const submenuItems = items.filter(item => item.type === 'submenu');

    return menuItems.map(menu => ({
      ...menu,
      children: submenuItems
        .filter(sub => sub.parent_id === menu.id)
        .sort((a, b) => a.order_index - b.order_index),
    }));
  }, [items]);

  // Upsert mutation
  const upsertMutation = useMutation({
    mutationFn: async (formData: NavigationItemFormData) => {
      const sessionToken = localStorage.getItem('admin_session_token');
      const userEmail = localStorage.getItem('admin_email');

      if (!sessionToken || !userEmail) {
        throw new Error('Sessão não encontrada');
      }

      const { data, error } = await supabase.rpc('admin_upsert_navigation_item', {
        p_id: formData.id || null,
        p_type: formData.type,
        p_parent_id: formData.parent_id || null,
        p_slug: formData.slug,
        p_path: formData.path,
        p_order_index: formData.order_index,
        p_is_visible: formData.is_visible,
        p_status: formData.status,
        p_restricted_to_registered: formData.restricted_to_registered,
        p_label_pt_br: formData.label_pt_br,
        p_label_en: formData.label_en || null,
        p_label_es: formData.label_es || null,
        p_label_tr: formData.label_tr || null,
        p_icon: formData.icon || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      toast({
        title: 'Sucesso',
        description: 'Item de navegação salvo com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supabase.rpc('admin_delete_navigation_item', {
        p_id: itemId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['navigation-items'] });
      toast({
        title: 'Sucesso',
        description: 'Item de navegação excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle visibility
  const toggleVisibility = useCallback(async (item: NavigationItem) => {
    await upsertMutation.mutateAsync({
      id: item.id,
      type: item.type,
      parent_id: item.parent_id,
      slug: item.slug,
      path: item.path,
      order_index: item.order_index,
      is_visible: !item.is_visible,
      status: item.status,
      restricted_to_registered: item.restricted_to_registered,
      label_pt_br: item.label_pt_br,
      label_en: item.label_en || '',
      label_es: item.label_es || '',
      label_tr: item.label_tr || '',
      icon: item.icon || '',
    });
  }, [upsertMutation]);

  // Toggle status
  const toggleStatus = useCallback(async (item: NavigationItem) => {
    await upsertMutation.mutateAsync({
      id: item.id,
      type: item.type,
      parent_id: item.parent_id,
      slug: item.slug,
      path: item.path,
      order_index: item.order_index,
      is_visible: item.is_visible,
      status: item.status === 'active' ? 'inactive' : 'active',
      restricted_to_registered: item.restricted_to_registered,
      label_pt_br: item.label_pt_br,
      label_en: item.label_en || '',
      label_es: item.label_es || '',
      label_tr: item.label_tr || '',
      icon: item.icon || '',
    });
  }, [upsertMutation]);

  return {
    items,
    menus,
    isLoading,
    error,
    getOrganizedItems,
    upsertItem: upsertMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    toggleVisibility,
    toggleStatus,
    isUpserting: upsertMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
