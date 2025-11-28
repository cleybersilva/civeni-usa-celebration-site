
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
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg px-3 sm:px-4 md:px-6">
        <CardTitle className="text-primary-foreground flex items-center gap-2 text-sm sm:text-base md:text-lg">
          {t('admin.dashboard.actions', 'Ações')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          <Button 
            onClick={onGenerateReport} 
            className="flex-1 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm md:text-base"
            size="default"
          >
            📊 {t('admin.dashboard.generateDailyReport', 'Gerar Relatório Diário')}
          </Button>
          <Button 
            variant="outline" 
            onClick={onRefreshData} 
            className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 text-xs sm:text-sm md:text-base"
            size="default"
          >
            🔄 {t('admin.dashboard.refreshData', 'Atualizar Dados')}
          </Button>
        </div>
        <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-2 sm:mt-3 text-center">
          Use "Gerar Relatório Diário" para criar um novo relatório e enviar alertas por email/SMS
        </p>
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
