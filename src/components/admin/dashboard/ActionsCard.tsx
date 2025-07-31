
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
        <CardTitle className="text-primary-foreground flex items-center gap-2">
          {t('admin.dashboard.actions', 'Ações')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={onGenerateReport} 
            className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex-1"
            size="lg"
          >
            📊 {t('admin.dashboard.generateDailyReport', 'Gerar Relatório Diário')}
          </Button>
          <Button 
            variant="outline" 
            onClick={onRefreshData} 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            size="lg"
          >
            🔄 {t('admin.dashboard.refreshData', 'Atualizar Dados')}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Use "Gerar Relatório Diário" para criar um novo relatório e enviar alertas por email/SMS
        </p>
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
