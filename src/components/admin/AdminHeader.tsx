
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { SidebarTrigger } from '@/components/ui/sidebar';

const AdminHeader = () => {
  const navigate = useNavigate();
  const { user, logout, isAdminRoot } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      admin_root: 'Admin Root',
      admin: 'Administrador',
      design: 'Designer',
      editor: 'Editor',
      viewer: 'Visualizador'
    };
    return labels[userType as keyof typeof labels] || userType;
  };

  return (
    <header className="bg-white border-b">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="md:hidden" />
          <div>
            <h1 className="text-2xl font-bold text-civeni-blue">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              {user?.email} ({getUserTypeLabel(user?.user_type || '')})
              {isAdminRoot() && <span className="ml-2 text-red-600 font-bold">[ROOT]</span>}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            size="sm"
          >
            Ver Site
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            size="sm"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
