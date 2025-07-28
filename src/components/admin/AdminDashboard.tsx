
import React from 'react';
import { useTranslation } from 'react-i18next';
import FinancialDashboard from './FinancialDashboard';

const AdminDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('admin.dashboard.title', 'Dashboard Financeiro')}</h2>
        <p className="text-muted-foreground">
          {t('admin.dashboard.subtitle', 'Acompanhe inscrições, pagamentos e alertas em tempo real')}
        </p>
      </div>
      
      <FinancialDashboard />
    </div>
  );
};

export default AdminDashboard;
