
import React from 'react';
import { SidebarFooter } from '@/components/ui/sidebar';

const AdminSidebarFooter = () => {
  return (
    <SidebarFooter className="border-t p-4 bg-gray-50/50">
      <div className="flex justify-center items-center">
        <img 
          src="/lovable-uploads/18e671d0-0426-486d-977d-88d336f3c0de.png" 
          alt="CIVENI" 
          className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
        />
      </div>
    </SidebarFooter>
  );
};

export default AdminSidebarFooter;
