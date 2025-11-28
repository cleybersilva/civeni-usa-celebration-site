
import React from 'react';
import { SidebarFooter } from '@/components/ui/sidebar';

const AdminSidebarFooter = () => {
  return (
    <SidebarFooter className="border-t p-3 tablet:p-3 md:p-4" style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)' }}>
      <div className="flex justify-center items-center">
        <img 
          src="/uploads/civeni-2025-logo-sidebar.png" 
          alt="III CIVENI 2025" 
          className="h-8 tablet:h-9 md:h-10 lg:h-12 w-auto object-contain"
        />
      </div>
    </SidebarFooter>
  );
};

export default AdminSidebarFooter;
