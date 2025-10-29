
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { SidebarTrigger } from '@/components/ui/sidebar';
import LanguageSelector from './LanguageSelector';

const AdminHeader = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAdminRoot } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      admin_root: t('admin.adminRoot', 'Admin Root'),
      admin: t('admin.administrator', 'Administrador'),
      design: t('admin.designer', 'Designer'),
      editor: t('admin.editor', 'Editor'),
      viewer: t('admin.viewer', 'Visualizador')
    };
    return labels[userType as keyof typeof labels] || userType;
  };

  return (
    <header className="bg-gradient-to-br from-[#1a3a52] via-[#2d4a5e] to-[#6b2d5c] border-b h-16">
      <div className="flex justify-between items-center px-6 py-3 h-full">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="h-8 w-8 text-white hover:text-white/80" />
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-md">
              Dashboard
            </h1>
            <p className="text-xs text-white/90 drop-shadow-sm">
              {user?.email} ({getUserTypeLabel(user?.user_type || '')})
              {isAdminRoot() && <span className="ml-2 text-red-300 font-bold">[ROOT]</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageSelector />
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            size="sm"
            className="border-white text-white bg-white/10 hover:bg-white hover:text-civeni-blue transition-all duration-200"
          >
            {t('admin.viewSite', 'Ver Site')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            size="sm"
            className="bg-civeni-red hover:bg-civeni-red/90"
          >
            {t('admin.logout', 'Sair')}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
