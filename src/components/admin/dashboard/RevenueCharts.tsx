
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';

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

const RevenueCharts = ({ dailyData, weeklyData, batchData }: RevenueChartsProps) => {
  const chartConfig = {
    faturamento: {
      label: "Faturamento (R$)",
      color: "#059669",
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faturamento por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']} />} 
                />
                <Bar dataKey="faturamento" fill="var(--color-faturamento)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faturamento por Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']} />} 
                />
                <Line type="monotone" dataKey="faturamento" stroke="var(--color-faturamento)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Faturamento por Lote</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']} />} 
                />
                <Bar dataKey="faturamento" fill="var(--color-faturamento)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueCharts;
