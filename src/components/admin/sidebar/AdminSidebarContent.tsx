
import React from 'react';
import { SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { MenuItem } from './types';

interface AdminSidebarContentProps {
  visibleItems: MenuItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const AdminSidebarContent = ({ visibleItems, activeTab, onTabChange }: AdminSidebarContentProps) => {
  return (
    <SidebarContent className="px-2 py-3 tablet:py-3 md:py-4 flex-1 overflow-y-auto">
      <SidebarMenu className="space-y-0.5 tablet:space-y-0.5 md:space-y-1">
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full justify-start text-left px-3 tablet:px-3 md:px-4 py-2 tablet:py-2 md:py-2.5 lg:py-3 text-xs tablet:text-xs md:text-sm font-medium transition-all duration-300 hover:bg-civeni-blue/10 hover:text-civeni-blue data-[active=true]:bg-civeni-blue data-[active=true]:text-white data-[active=true]:shadow-md rounded-lg group"
            >
              <item.icon className="h-4 w-4 tablet:h-4 tablet:w-4 md:h-5 md:w-5 mr-2 tablet:mr-2 md:mr-3 transition-transform duration-200 group-hover:scale-110 shrink-0" />
              <span className="transition-all duration-200 truncate text-left">{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
};

export default AdminSidebarContent;
