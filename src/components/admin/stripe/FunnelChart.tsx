import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

interface FunnelChartProps {
  data: any;
  loading?: boolean;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = data.steps || [];
  const maxCount = steps[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step: any, index: number) => {
          const width = (step.count / maxCount) * 100;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.step} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{step.step}</span>
                <div className="flex gap-2 items-center">
                  <span className="font-bold">{step.count.toLocaleString('pt-BR')}</span>
                  <span className="text-muted-foreground">({step.percentage}%)</span>
                </div>
              </div>
              
              <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 flex items-center justify-center text-white font-medium ${
                    isLast ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{ width: `${width}%` }}
                >
                  {width > 20 && <span>{step.percentage}%</span>}
                </div>
              </div>
              
              {!isLast && (
                <div className="flex justify-center">
                  <div className="text-xs text-muted-foreground">
                    ↓ {steps[index + 1]?.percentage}% conversão
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Taxa de Conversão Total</p>
            <p className="text-3xl font-bold text-green-500">{data.taxa_conversao?.toFixed(2)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
