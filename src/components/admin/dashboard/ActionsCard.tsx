
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
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg">
        <CardTitle className="text-primary-foreground">{t('admin.dashboard.actions', 'Ações')}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Button 
            onClick={onGenerateReport} 
            className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {t('admin.dashboard.generateDailyReport', 'Gerar Relatório Diário')}
          </Button>
          <Button 
            variant="outline" 
            onClick={onRefreshData} 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            {t('admin.dashboard.refreshData', 'Atualizar Dados')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
