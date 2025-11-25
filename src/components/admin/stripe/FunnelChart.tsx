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
      <CardHeader style={{ background: 'linear-gradient(135deg, hsl(270 100% 98%), hsl(280 100% 96%))' }} className="pb-3 sm:pb-4 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 sm:gap-3 text-purple-700">
          <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100">
            <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-xl font-bold truncate">Funil de Conversão</span>
            <span className="text-xs sm:text-sm font-normal text-purple-600 hidden sm:block">Acompanhe sua jornada de vendas</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-3 sm:px-6">
        {/* Primeiras duas etapas lado a lado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {steps.slice(0, 2).map((step: any, index: number) => {
            const width = (step.count / maxCount) * 100;
            const config = stepConfigs[index] || stepConfigs[stepConfigs.length - 1];
            
            return (
              <div key={step.step} className="space-y-2 sm:space-y-3">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{config.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 truncate">{step.step}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Etapa {index + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {step.count.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground ml-2">{step.percentage}%</span>
                  </div>
                </div>
                
                <div className="relative h-10 sm:h-12 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-600">
                  <div 
                    className="h-full transition-all duration-700 ease-out flex items-center justify-center text-white font-bold text-sm sm:text-base relative overflow-hidden"
                    style={{ 
                      width: `${width}%`,
                      background: config.gradient
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10"></div>
                    {width > 15 && (
                      <span className="drop-shadow-lg z-10">{step.percentage}%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seta indicando progressão */}
        <div className="flex justify-center items-center gap-2 py-0.5 sm:py-1">
          <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 animate-bounce" />
          <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
            {steps[2]?.percentage}% completam o pagamento
          </div>
          <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 animate-bounce" />
        </div>

        {/* Última etapa - Pagamento Confirmado */}
        {steps.slice(2).map((step: any, index: number) => {
          const actualIndex = index + 2;
          const width = (step.count / maxCount) * 100;
          const config = stepConfigs[actualIndex] || stepConfigs[stepConfigs.length - 1];
          
          return (
            <div key={step.step} className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{config.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 truncate">{step.step}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Etapa Final</p>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {step.count.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">{step.percentage}% do total</span>
                </div>
              </div>
              
              <div className="relative h-12 sm:h-16 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden shadow-inner border-2 border-emerald-300 dark:border-emerald-700">
                <div 
                  className="h-full transition-all duration-700 ease-out flex items-center justify-center text-white font-bold text-base sm:text-xl relative overflow-hidden"
                  style={{ 
                    width: `${width}%`,
                    background: config.gradient
                  }}
                >
                  <div className="absolute inset-0 bg-white/10"></div>
                  {width > 15 && (
                    <span className="drop-shadow-lg z-10 flex items-center gap-1.5 sm:gap-2">
                      {step.percentage}%
                      <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Taxa de Conversão Total */}
        <div className="pt-4 sm:pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="relative p-4 sm:p-8 rounded-2xl shadow-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(145 63% 42%))' }}>
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-40 sm:h-40 bg-black/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 text-center space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                <p className="text-xs sm:text-base font-bold text-white uppercase tracking-wider">
                  Taxa de Conversão Total
                </p>
              </div>
              <p className="text-4xl sm:text-6xl font-extrabold text-white drop-shadow-lg">
                {data.taxa_conversao?.toFixed(2)}%
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-2">
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <p className="text-xs sm:text-sm text-white/80">Finalizados</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{data.charges_succeeded?.toLocaleString('pt-BR')}</p>
                </div>
                <span className="text-2xl sm:text-3xl text-white/60 hidden sm:inline">/</span>
                <span className="text-lg sm:hidden text-white/60">de</span>
                <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <p className="text-xs sm:text-sm text-white/80">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{data.total_sessions?.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
