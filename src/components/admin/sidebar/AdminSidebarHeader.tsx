
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const AdminSidebarHeader = () => {
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarHeader 
      className="border-b px-4 md:px-5 lg:px-6 py-2 md:py-3 h-14 md:h-16 relative"
      style={{
        background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)'
      }}
    >
      {/* Botão fechar - visível apenas no mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 md:hidden h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 border border-white/40 text-white"
        onClick={() => setOpenMobile(false)}
        aria-label="Fechar menu"
      >
        <X className="h-5 w-5" />
      </Button>
      
      <div className="flex items-center justify-center h-full">
        <img 
          src="/lovable-uploads/d7a1c7d2-c77d-46ae-b1d0-a882c59b41fd.png" 
          alt="CIVENI" 
          className="h-8 md:h-9 lg:h-10 w-auto object-contain"
        />
      </div>
    </SidebarHeader>
  );
};

export default AdminSidebarHeader;
