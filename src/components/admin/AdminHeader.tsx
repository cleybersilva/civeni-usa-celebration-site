
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
    <header 
      className="border-b h-auto min-h-[64px] md:h-16"
      style={{
        background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)'
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-6 py-3 gap-3">
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <SidebarTrigger className="h-8 w-8 text-white hover:text-white/80 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md truncate">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-white/90 drop-shadow-sm truncate">
              <span className="hidden sm:inline">{user?.email}</span>
              <span className="sm:hidden">{user?.email?.split('@')[0]}</span>
              <span className="hidden md:inline"> ({getUserTypeLabel(user?.user_type || '')})</span>
              {isAdminRoot() && <span className="ml-1 sm:ml-2 text-red-300 font-bold">[ROOT]</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <LanguageSelector />
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            size="sm"
            className="border-white text-white bg-white/10 hover:bg-white hover:text-civeni-blue transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">{t('admin.viewSite', 'Ver Site')}</span>
            <span className="sm:hidden">Site</span>
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            size="sm"
            className="bg-civeni-red hover:bg-civeni-red/90 text-xs sm:text-sm px-2 sm:px-3"
          >
            {t('admin.logout', 'Sair')}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
