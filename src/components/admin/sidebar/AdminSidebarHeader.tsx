
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarHeader } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  const { t } = useTranslation();

  return (
    <SidebarHeader 
      className="border-b px-6 py-3 h-16"
      style={{
        background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)'
      }}
    >
      <div className="flex items-center justify-center h-full">
        <img 
          src="/lovable-uploads/d7a1c7d2-c77d-46ae-b1d0-a882c59b41fd.png" 
          alt="CIVENI" 
          className="h-10 w-auto object-contain"
        />
      </div>
    </SidebarHeader>
  );
};

export default AdminSidebarHeader;
