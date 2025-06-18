
import React from 'react';
import { SidebarHeader, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

const AdminSidebarHeader = () => {
  const { state } = useSidebar();

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
        <SidebarTrigger className="h-8 w-8 text-white hover:bg-white/20 transition-colors duration-200 rounded-md flex items-center justify-center">
          <div className="relative w-5 h-5 flex flex-col justify-center items-center">
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${state === 'collapsed' ? 'rotate-45 translate-y-0.5' : 'mb-1'}`}></span>
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${state === 'collapsed' ? 'opacity-0' : 'mb-1'}`}></span>
            <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${state === 'collapsed' ? '-rotate-45 -translate-y-0.5' : ''}`}></span>
          </div>
        </SidebarTrigger>
      </div>
    </SidebarHeader>
  );
};

export default AdminSidebarHeader;
