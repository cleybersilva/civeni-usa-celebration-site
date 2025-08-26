
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarHeader } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  const { t } = useTranslation();

  return (
    <SidebarHeader className="border-b px-6 py-3 h-16 bg-gradient-to-r from-civeni-blue to-civeni-blue/90">
      <div className="flex items-center justify-center h-full">
        <div>
          <h2 className="text-xl font-bold text-white">
            CIVENI SaaS
          </h2>
          <p className="text-xs text-white/80">
            Veni Creator Christian University
          </p>
        </div>
      </div>
    </SidebarHeader>
  );
};

export default AdminSidebarHeader;
