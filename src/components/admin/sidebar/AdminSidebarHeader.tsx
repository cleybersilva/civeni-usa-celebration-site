
import React from 'react';
import { SidebarHeader } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  return (
    <SidebarHeader className="border-b px-6 py-3 h-16 bg-gradient-to-r from-civeni-blue to-civeni-blue/90">
      <div className="flex items-center justify-center h-full">
        <div>
          <h2 className="text-xl font-bold text-white">
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
