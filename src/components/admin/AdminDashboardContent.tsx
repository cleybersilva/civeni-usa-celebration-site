
import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import UserInfo from '@/components/admin/UserInfo';

const AdminDashboardContent = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-100 flex w-full">
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <main className="flex-1 space-y-6 p-6">
            <UserInfo />
            <div id="admin-content" className="space-y-6">
              {/* O conteúdo das abas será renderizado aqui */}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboardContent;
