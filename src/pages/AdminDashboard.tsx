
import React from 'react';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminDashboardContent from '@/components/admin/AdminDashboardContent';
import { useAdminAuth, AdminAuthProvider } from '@/hooks/useAdminAuth';
import { CMSProvider } from '@/contexts/CMSContext';

const AdminDashboardInner = () => {
  const { user } = useAdminAuth();

  if (!user) {
    return (
      <div className="p-0 m-0">
        <AdminLoginForm />
      </div>
    );
  }

  return (
    <div className="p-0 m-0">
      <AdminDashboardContent />
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <AdminAuthProvider>
      <CMSProvider>
        <div className="p-0 m-0">
          <AdminDashboardInner />
        </div>
      </CMSProvider>
    </AdminAuthProvider>
  );
};

export default AdminDashboard;
