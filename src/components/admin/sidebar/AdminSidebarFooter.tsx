
import React from 'react';
import { SidebarFooter } from '@/components/ui/sidebar';

const AdminSidebarFooter = () => {
  return (
    <SidebarFooter className="border-t p-4" style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)' }}>
      <div className="flex justify-center items-center">
        <img 
          src="/lovable-uploads/d2cf60ac-a7a6-4538-88d6-ab40f772400e.png" 
          alt="CIVENI" 
          className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
        />
      </div>
    </SidebarFooter>
  );
};

export default AdminSidebarFooter;
