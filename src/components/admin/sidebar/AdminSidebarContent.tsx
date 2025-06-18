
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
    <SidebarContent className="px-2 py-4 flex-1 overflow-hidden">
      <SidebarMenu className="space-y-1">
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full justify-start px-4 py-3 text-sm font-medium transition-all duration-300 hover:bg-civeni-blue/10 hover:text-civeni-blue data-[active=true]:bg-civeni-blue data-[active=true]:text-white data-[active=true]:shadow-md rounded-lg group"
            >
              <item.icon className="h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
              <span className="transition-all duration-200">{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarContent>
  );
};

export default AdminSidebarContent;
