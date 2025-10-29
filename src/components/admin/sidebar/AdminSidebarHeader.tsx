
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarHeader } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  const { t } = useTranslation();

  return (
    <SidebarHeader 
      className="border-b px-6 py-3 h-16"
      style={{
        background: 'linear-gradient(to bottom right, hsl(200 48% 21%), hsl(200 35% 27%), hsl(300 35% 28%))'
      }}
    >
      <div className="flex items-center justify-center h-full">
        <div>
          <h2 className="text-xl font-bold text-white drop-shadow-md">
            CIVENI SaaS
          </h2>
          <p className="text-xs text-white/90 drop-shadow-sm">
            Veni Creator Christian University
          </p>
        </div>
      </div>
    </SidebarHeader>
  );
};

export default AdminSidebarHeader;
