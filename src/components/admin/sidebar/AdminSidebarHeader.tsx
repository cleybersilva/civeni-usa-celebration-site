
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarHeader } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  const { t } = useTranslation();

  return (
    <SidebarHeader className="border-b px-6 py-3 h-16 bg-gradient-to-br from-admin-gradient-from via-admin-gradient-via to-admin-gradient-to">
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
