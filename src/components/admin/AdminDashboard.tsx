
import React from 'react';
import FinancialDashboard from './FinancialDashboard';

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
        <p className="text-muted-foreground">
          Acompanhe inscrições, pagamentos e alertas em tempo real
        </p>
      </div>
      
      <FinancialDashboard />
    </div>
  );
};

export default AdminDashboard;
