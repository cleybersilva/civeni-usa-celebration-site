
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '@/components/ui/sidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminSidebarHeader from './sidebar/AdminSidebarHeader';
import AdminSidebarContent from './sidebar/AdminSidebarContent';
import AdminSidebarFooter from './sidebar/AdminSidebarFooter';
import { createMenuItems } from './sidebar/menuItems';

const AdminSidebar = () => {
  const { t } = useTranslation();
  const { hasPermission, isAdminRoot, user } = useAdminAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.user_type === 'editor') {
      return 'contador';
    }
    const canViewFinanceiro = isAdminRoot() || user?.user_type === 'admin';
    return canViewFinanceiro ? 'financeiro' : 'banner';
  });

  // Verificar permissões
  const canViewFinanceiro = isAdminRoot() || user?.user_type === 'admin';
  const canViewUsuarios = isAdminRoot() || user?.user_type === 'admin';

  const menuItems = createMenuItems(hasPermission, isAdminRoot, canViewFinanceiro, canViewUsuarios, t);

  const visibleItems = menuItems
    .filter(item => item.show)
    .sort((a, b) => a.order - b.order);

  // Comunicar mudança de aba para o componente pai
  React.useEffect(() => {
    // Dispatch custom event para comunicar mudança de aba
    window.dispatchEvent(new CustomEvent('adminTabChange', { 
      detail: { activeTab } 
    }));
  }, [activeTab]);

  return (
    <Sidebar className="border-r bg-white shadow-sm">
      <AdminSidebarHeader />
      <AdminSidebarContent 
        visibleItems={visibleItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <AdminSidebarFooter />
    </Sidebar>
  );
};

export default AdminSidebar;
