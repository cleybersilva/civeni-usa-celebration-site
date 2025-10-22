import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
    visa: 'hsl(var(--chart-1))',
    mastercard: 'hsl(var(--chart-2))',
    amex: 'hsl(var(--chart-3))',
    elo: 'hsl(var(--chart-4))',
    hipercard: 'hsl(var(--chart-5))',
    unknown: 'hsl(var(--muted-foreground))'
  };

  const getBrandColor = (brand: string) => {
    return brandColors[brand.toLowerCase()] || brandColors.unknown;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Receita por Bandeira
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tickFormatter={formatCurrency} className="text-xs" />
            <YAxis 
              type="category" 
              dataKey="bandeira" 
              width={100}
              className="text-xs"
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
              fill="hsl(var(--primary))"
              radius={[0, 4, 4, 0]}
              name="Receita Líquida"
            />
          </BarChart>
        </ResponsiveContainer>
        
        {/* Legend com badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {data.map((item) => (
            <div 
              key={`${item.bandeira}-${item.funding}`}
              className="flex items-center gap-2 text-xs px-2 py-1 rounded-md border"
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getBrandColor(item.bandeira) }}
              />
              <span className="font-medium capitalize">{item.bandeira}</span>
              <span className="text-muted-foreground">({item.funding})</span>
              <span className="font-bold">{item.qtd}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
