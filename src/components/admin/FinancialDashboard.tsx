
import React, { useEffect } from 'react';
import StatsCards from './dashboard/StatsCards';
import ActionsCard from './dashboard/ActionsCard';
import AlertsLog from './dashboard/AlertsLog';
import { useFinancialData } from './dashboard/hooks/useFinancialData';

const FinancialDashboard = () => {
  const {
    stats,
    alerts,
    loading,
    generateDailyReport,
    refreshData
  } = useFinancialData();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsCards stats={null} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
      <ActionsCard 
        onGenerateReport={generateDailyReport}
        onRefreshData={refreshData}
      />
      <AlertsLog alerts={alerts} />
    </div>
  );
};

export default FinancialDashboard;
