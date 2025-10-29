import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { CreditCard } from 'lucide-react';

interface BrandChartProps {
  data: any[];
  loading?: boolean;
}

export const BrandChart: React.FC<BrandChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Receita por Bandeira
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const brandColors: Record<string, string> = {
    visa: '#1434CB',
    mastercard: '#EB001B',
    amex: '#006FCF',
    elo: '#FFCB05',
    hipercard: '#E31E24',
    unknown: '#64748b'
  };

  const brandBgColors: Record<string, string> = {
    visa: 'bg-blue-600',
    mastercard: 'bg-red-600',
    amex: 'bg-blue-700',
    elo: 'bg-yellow-500',
    hipercard: 'bg-red-600',
    unknown: 'bg-gray-500'
  };

  const getBrandColor = (brand: string) => {
    return brandColors[brand.toLowerCase()] || brandColors.unknown;
  };

  const getBrandBgColor = (brand: string) => {
    return brandBgColors[brand.toLowerCase()] || brandBgColors.unknown;
  };

  return (
    <Card className="border-l-4 border-l-orange-500 shadow-md">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <CreditCard className="h-5 w-5" />
          Receita por Bandeira
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tickFormatter={formatCurrency} className="text-xs" />
            <YAxis 
              type="category" 
              dataKey="bandeira" 
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
                <Cell key={`cell-${index}`} fill={getBrandColor(entry.bandeira)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend com badges coloridos */}
        <div className="flex flex-wrap gap-2 mt-4">
          {data.map((item) => (
            <div 
              key={`${item.bandeira}-${item.funding}`}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow"
              style={{ borderColor: getBrandColor(item.bandeira) }}
            >
              <div 
                className="w-4 h-4 rounded-full shadow-sm" 
                style={{ backgroundColor: getBrandColor(item.bandeira) }}
              />
              <span className="font-semibold capitalize">{item.bandeira}</span>
              <span className="text-muted-foreground font-medium">({item.funding})</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{item.qtd}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
