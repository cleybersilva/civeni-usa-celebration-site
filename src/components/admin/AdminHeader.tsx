
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
      className="border-b min-h-[80px] sm:min-h-[56px] md:min-h-[64px] lg:min-h-[72px] w-full"
      style={{
        background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)'
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-center h-full px-4 md:px-4 lg:px-6 py-3 md:py-3 lg:py-4 gap-3 sm:gap-0 w-full">
        <div className="flex items-center space-x-3 md:space-x-3 lg:space-x-4 w-full sm:w-auto">
          <SidebarTrigger className="h-8 w-8 md:h-8 md:w-8 text-white hover:text-white/80 shrink-0" />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-xl sm:text-lg md:text-xl lg:text-2xl font-bold text-white drop-shadow-md">
              Dashboard
            </h1>
            <p className="text-sm sm:text-xs md:text-sm lg:text-base text-white/90 drop-shadow-sm break-words">
              <span className="hidden sm:inline">{user?.email}</span>
              <span className="sm:hidden">{user?.email?.split('@')[0]}</span>
              <span className="hidden md:inline"> ({getUserTypeLabel(user?.user_type || '')})</span>
              {isAdminRoot() && <span className="ml-1 md:ml-2 text-red-300 font-bold">[ROOT]</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2 lg:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <LanguageSelector />
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              size="sm"
              className="border-white text-white bg-white/10 hover:bg-white hover:text-civeni-blue transition-all duration-200 text-sm sm:text-xs md:text-xs lg:text-sm px-4 sm:px-2 md:px-3 h-9 sm:h-7 md:h-8 lg:h-9"
            >
              {t('admin.viewSite', 'Ver Site')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              size="sm"
              className="bg-civeni-red hover:bg-civeni-red/90 text-sm sm:text-xs md:text-xs lg:text-sm px-4 sm:px-2 md:px-3 h-9 sm:h-7 md:h-8 lg:h-9"
            >
              {t('admin.logout', 'Sair')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
