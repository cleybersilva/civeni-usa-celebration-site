
import React from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminTabs from '@/components/admin/AdminTabs';
import UserInfo from '@/components/admin/UserInfo';

const AdminDashboardContent = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <UserInfo />
        <AdminTabs />
      </main>
    </div>
  );
};

export default AdminDashboardContent;
