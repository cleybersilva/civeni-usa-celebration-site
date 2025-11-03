import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { CreditCard } from 'lucide-react';

interface BrandChartProps {
  data: any[];
  loading?: boolean;
}

export const BrandChart: React.FC<BrandChartProps> = ({ data, loading }) => {
  console.log('🎨 BrandChart render:', { loading, dataLength: data?.length, data });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Receita por Forma de Pagamento
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

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Receita por Forma de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const brandColors: Record<string, string> = {
    'Cartão': '#1434CB',
    'Boleto': '#FF6B00',
    'Pix': '#00C896',
    'Outros': '#64748b'
  };

  const brandBgColors: Record<string, string> = {
    'Cartão': 'bg-blue-600',
    'Boleto': 'bg-orange-600',
    'Pix': 'bg-green-600',
    'Outros': 'bg-gray-500'
  };

  const getBrandColor = (method: string) => {
    return brandColors[method] || brandColors['Outros'];
  };

  const getBrandBgColor = (method: string) => {
    return brandBgColors[method] || brandBgColors['Outros'];
  };

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-md">
      <CardHeader style={{ background: 'linear-gradient(to right, hsl(33 100% 96%), hsl(48 100% 96%))' }}>
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <CreditCard className="h-5 w-5" />
          Receita por Forma de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tickFormatter={formatCurrency} className="text-xs" />
            <YAxis 
              type="category" 
              dataKey="forma_pagamento" 
              width={100}
              className="text-xs font-medium"
            />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar 
              dataKey="receita_liquida" 
              radius={[0, 8, 8, 0]}
              name="Receita Líquida"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBrandColor(entry.forma_pagamento || 'Outros')} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend com badges coloridos */}
        <div className="flex flex-wrap gap-2 mt-4">
          {data.map((item, idx) => (
            <div 
              key={`${idx}`}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: getBrandColor(item.forma_pagamento || 'Outros') }}
            >
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: getBrandColor(item.forma_pagamento || 'Outros') }}
              />
              <span className="font-semibold">{item.forma_pagamento || 'Outros'}</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{item.qtd}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
