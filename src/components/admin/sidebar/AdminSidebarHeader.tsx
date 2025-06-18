
import React from 'react';
import { SidebarHeader } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  return (
    <SidebarHeader className="border-b px-4 py-4 bg-gradient-to-r from-civeni-blue to-civeni-blue/90">
      <div className="flex items-center justify-center">
        <div>
          <h2 className="text-lg font-bold text-white">
            Admin Panel
          </h2>
          <p className="text-xs text-white/80">
            VCCU/Civeni USA
          </p>
        </div>
      </div>
    </SidebarHeader>
  );
};

export default AdminSidebarHeader;
