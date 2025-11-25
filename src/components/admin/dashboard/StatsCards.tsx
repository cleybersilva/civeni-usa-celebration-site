
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface RegistrationStats {
  total_registrations: number;
  completed_payments: number;
  pending_payments: number;
  total_revenue: number;
  today_registrations: number;
  today_revenue: number;
}

interface StatsCardsProps {
  stats: RegistrationStats | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const { t } = useTranslation();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(to bottom right, hsl(214 100% 97%), hsl(214 100% 92%))' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">{t('admin.dashboard.totalRegistrations', 'Total de Inscrições')}</CardTitle>
          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-blue-900">{stats.total_registrations}</div>
          <p className="text-[10px] sm:text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full inline-block mt-2">
            {t('admin.dashboard.today', 'Hoje')}: +{stats.today_registrations}
          </p>
        </CardContent>
      </Card>

      <Card className="border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(to bottom right, hsl(138 76% 97%), hsl(142 76% 91%))' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-800">{t('admin.dashboard.confirmedPayments', 'Pagamentos Confirmados')}</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-900">{stats.completed_payments}</div>
          <p className="text-[10px] sm:text-xs text-orange-700 bg-orange-200 px-2 py-1 rounded-full inline-block mt-2">
            {t('admin.dashboard.pending', 'Pendentes')}: {stats.pending_payments}
          </p>
        </CardContent>
      </Card>

      <Card className="border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(to bottom right, hsl(270 100% 98%), hsl(270 100% 95%))' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-800">{t('admin.dashboard.totalRevenue', 'Receita Total')}</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-purple-900">{formatCurrency(stats.total_revenue || 0)}</div>
          <p className="text-[10px] sm:text-xs text-purple-700 bg-purple-200 px-2 py-1 rounded-full inline-block mt-2">
            {t('admin.dashboard.today', 'Hoje')}: {formatCurrency(stats.today_revenue || 0)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 shadow-lg hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(to bottom right, hsl(48 100% 96%), hsl(48 96% 89%))' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-amber-800">{t('admin.dashboard.conversionRate', 'Taxa de Conversão')}</CardTitle>
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-amber-900">
            {stats.total_registrations ? 
              Math.round((stats.completed_payments / stats.total_registrations) * 100) : 0}%
          </div>
          <p className="text-[10px] sm:text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded-full inline-block mt-2">
            {t('admin.dashboard.paymentsRegistrations', 'Pagamentos/Inscrições')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
