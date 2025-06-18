
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';

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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-civeni-blue">
              Dashboard - VCCU/Civeni USA
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Logado como: {user?.email} ({getUserTypeLabel(user?.user_type || '')})
              {isAdminRoot() && <span className="ml-2 text-red-600 font-bold">[ROOT ACCESS]</span>}
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Ver Site
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
