import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicNavigationItem {
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
}

export interface OrganizedMenuItem {
  id: string;
  slug: string;
  path: string;
  label: string;
  status: 'active' | 'inactive';
  restricted_to_registered: boolean;
  items: {
    id: string;
    name: string;
    href: string;
    status: 'active' | 'inactive';
    restricted_to_registered: boolean;
  }[];
}

export function usePublicNavigation(language: string = 'pt') {
  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['public-navigation-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .eq('is_visible', true) // Only fetch visible items
        .order('type', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as PublicNavigationItem[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get label based on language
  const getLabel = (item: PublicNavigationItem): string => {
    switch (language) {
      case 'en':
        return item.label_en || item.label_pt_br;
      case 'es':
        return item.label_es || item.label_pt_br;
      case 'tr':
        return item.label_tr || item.label_pt_br;
      default:
        return item.label_pt_br;
    }
  };

  // Organize menu items with submenus
  const organizedMenuItems: OrganizedMenuItem[] = rawItems
    .filter(item => item.type === 'menu')
    .map(menu => {
      const submenus = rawItems
        .filter(item => item.type === 'submenu' && item.parent_id === menu.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map(sub => ({
          id: sub.id,
          name: getLabel(sub),
          href: sub.path,
          status: sub.status,
          restricted_to_registered: sub.restricted_to_registered,
        }));

      return {
        id: menu.id,
        slug: menu.slug,
        path: menu.path,
        label: getLabel(menu),
        status: menu.status,
        restricted_to_registered: menu.restricted_to_registered,
        items: submenus,
      };
    });

  return {
    menuItems: organizedMenuItems,
    isLoading,
  };
}
