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

  const stepColors = [
    'bg-gradient-to-r from-blue-500 to-blue-600',
    'bg-gradient-to-r from-cyan-500 to-cyan-600',
    'bg-gradient-to-r from-emerald-500 to-emerald-600'
  ];

  return (
    <Card className="border-l-4 border-l-purple-500 shadow-md">
      <CardHeader style={{ background: 'linear-gradient(to right, hsl(270 100% 98%), hsl(330 100% 98%))' }}>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <TrendingDown className="h-5 w-5" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {steps.map((step: any, index: number) => {
          const width = (step.count / maxCount) * 100;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.step} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{step.step}</span>
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-gray-900 dark:text-gray-100">{step.count.toLocaleString('pt-BR')}</span>
                  <span className="text-muted-foreground">({step.percentage}%)</span>
                </div>
              </div>
              
              <div className="relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                <div 
                  className={`h-full transition-all duration-500 flex items-center justify-center text-white font-semibold ${
                    stepColors[index] || stepColors[stepColors.length - 1]
                  }`}
                  style={{ width: `${width}%` }}
                >
                  {width > 20 && <span className="drop-shadow-md">{step.percentage}%</span>}
                </div>
              </div>
              
              {!isLast && (
                <div className="flex justify-center">
                  <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    ↓ {steps[index + 1]?.percentage}% conversão
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center p-4 rounded-lg" style={{ background: 'linear-gradient(to right, hsl(138 76% 97%), hsl(160 84% 96%))' }}>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Conversão Total</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-1">{data.taxa_conversao?.toFixed(2)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
