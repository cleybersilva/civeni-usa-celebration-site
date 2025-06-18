
import React from 'react';
import { SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  return (
    <SidebarHeader className="border-b px-4 py-4 bg-gradient-to-r from-civeni-blue to-civeni-blue/90">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">
            Admin Panel
          </h2>
          <p className="text-xs text-white/80">
            VCCU/Civeni USA
          </p>
        </div>
        <SidebarTrigger className="h-8 w-8 text-white hover:bg-white/20 transition-colors duration-200 rounded-md" />
      </div>
    </SidebarHeader>
  );
};

export default AdminSidebarHeader;
