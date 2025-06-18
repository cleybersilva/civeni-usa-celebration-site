
import React from 'react';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminDashboardContent from '@/components/admin/AdminDashboardContent';
import { useAdminAuth, AdminAuthProvider } from '@/hooks/useAdminAuth';
import { CMSProvider } from '@/contexts/CMSContext';

const AdminDashboardInner = () => {
  const { user } = useAdminAuth();

  if (!user) {
    return <AdminLoginForm />;
  }

  return <AdminDashboardContent />;
};

const AdminDashboard = () => {
  return (
    <AdminAuthProvider>
      <CMSProvider>
        <AdminDashboardInner />
      </CMSProvider>
    </AdminAuthProvider>
  );
};

export default AdminDashboard;
