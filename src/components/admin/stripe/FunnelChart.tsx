import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, ArrowDown, CheckCircle2 } from 'lucide-react';

interface FunnelChartProps {
  data: any;
  loading?: boolean;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader style={{ background: 'linear-gradient(135deg, hsl(270 100% 98%), hsl(280 100% 96%))' }}>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <TrendingDown className="h-6 w-6" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <p className="text-muted-foreground font-medium">Carregando dados...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = data.steps || [];
  const maxCount = steps[0]?.count || 1;

  const stepConfigs = [
    { 
      gradient: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(221 83% 53%))',
      icon: '🚀',
      color: 'text-blue-700'
    },
    { 
      gradient: 'linear-gradient(135deg, hsl(195 100% 50%), hsl(199 89% 48%))',
      icon: '⚡',
      color: 'text-cyan-700'
    },
    { 
      gradient: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(145 63% 42%))',
      icon: '✅',
      color: 'text-emerald-700'
    }
  ];

  return (
    <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader style={{ background: 'linear-gradient(135deg, hsl(270 100% 98%), hsl(280 100% 96%))' }} className="pb-4">
        <CardTitle className="flex items-center gap-3 text-purple-700">
          <div className="p-2 rounded-lg bg-purple-100">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold">Funil de Conversão</span>
            <span className="text-sm font-normal text-purple-600">Acompanhe sua jornada de vendas</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {steps.map((step: any, index: number) => {
          const width = (step.count / maxCount) * 100;
          const isLast = index === steps.length - 1;
          const config = stepConfigs[index] || stepConfigs[stepConfigs.length - 1];
          
          return (
            <div key={step.step} className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{config.icon}</span>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{step.step}</p>
                    <p className="text-xs text-muted-foreground">Etapa {index + 1} de {steps.length}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {step.count.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-sm text-muted-foreground">{step.percentage}% do total</span>
                </div>
              </div>
              
              <div className="relative h-14 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-600">
                <div 
                  className="h-full transition-all duration-700 ease-out flex items-center justify-center text-white font-bold text-lg relative overflow-hidden"
                  style={{ 
                    width: `${width}%`,
                    background: config.gradient
                  }}
                >
                  <div className="absolute inset-0 bg-white/10"></div>
                  {width > 15 && (
                    <span className="drop-shadow-lg z-10 flex items-center gap-2">
                      {step.percentage}%
                      {isLast && <CheckCircle2 className="h-5 w-5" />}
                    </span>
                  )}
                </div>
              </div>
              
              {!isLast && (
                <div className="flex justify-center items-center gap-2 py-2">
                  <ArrowDown className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                  <div className="px-3 py-1 rounded-full text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
                    {steps[index + 1]?.percentage}% avançam para próxima etapa
                  </div>
                  <ArrowDown className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <div className="text-center p-6 rounded-2xl shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(138 76% 97%), hsl(160 84% 96%))' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                📊 Taxa de Conversão Total
              </p>
              <p className="text-5xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {data.taxa_conversao?.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {data.charges_succeeded} de {data.total_sessions} finalizaram com sucesso
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
