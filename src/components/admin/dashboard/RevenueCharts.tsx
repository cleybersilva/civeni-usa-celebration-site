import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface RevenueData {
  name: string;
  faturamento: number;
  periodo: string;
}

interface RevenueChartsProps {
  dailyData: RevenueData[];
  weeklyData: RevenueData[];
  batchData: RevenueData[];
}

const COLORS = ['#059669', '#dc2626', '#2563eb', '#ca8a04', '#9333ea', '#c2410c', '#16a34a', '#7c3aed'];

const RevenueCharts = ({ dailyData, weeklyData, batchData }: RevenueChartsProps) => {
  const chartConfig = {
    faturamento: {
      label: "Faturamento (R$)",
      color: "#059669",
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Faturamento por Dia</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-[280px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={formatCurrency}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']} />} 
                  />
                  <Bar 
                    dataKey="faturamento" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Faturamento por Semana</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-[280px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={formatCurrency}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']} />} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="faturamento" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#d97706' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Faturamento por Lote</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-[280px] flex items-center justify-center">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <Pie
                    data={batchData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="faturamento"
                  >
                    {batchData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']} />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueCharts;
