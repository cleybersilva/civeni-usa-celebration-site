
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ActionsCardProps {
  onGenerateReport: () => void;
  onRefreshData: () => void;
}

const ActionsCard: React.FC<ActionsCardProps> = ({ onGenerateReport, onRefreshData }) => {
  const { t } = useTranslation();

  return (
    <Card className="bg-gradient-to-r from-civeni-blue/10 to-civeni-blue/20 border-civeni-blue/30 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-civeni-blue to-civeni-blue/90 text-white rounded-t-lg">
        <CardTitle className="text-white">{t('admin.dashboard.actions', 'Ações')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Button 
            onClick={onGenerateReport} 
            className="bg-gradient-to-r from-civeni-red to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('admin.dashboard.generateDailyReport', 'Gerar Relatório Diário')}
          </Button>
          <Button 
            variant="outline" 
            onClick={onRefreshData} 
            className="border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white transition-all duration-300"
          >
            {t('admin.dashboard.refreshData', 'Atualizar Dados')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
