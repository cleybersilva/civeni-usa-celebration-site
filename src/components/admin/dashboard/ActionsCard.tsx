
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ActionsCardProps {
  onGenerateReport: () => void;
  onRefreshData: () => void;
}

const ActionsCard: React.FC<ActionsCardProps> = ({ onGenerateReport, onRefreshData }) => {
  return (
    <Card className="bg-gradient-to-r from-civeni-blue/10 to-civeni-blue/20 border-civeni-blue/30 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-civeni-blue to-civeni-blue/90 text-white rounded-t-lg">
        <CardTitle className="text-white">Ações</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Button 
            onClick={onGenerateReport} 
            className="bg-gradient-to-r from-civeni-red to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Gerar Relatório Diário
          </Button>
          <Button 
            variant="outline" 
            onClick={onRefreshData} 
            className="border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white transition-all duration-300"
          >
            Atualizar Dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionsCard;
