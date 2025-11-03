

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { supabase } from '@/integrations/supabase/client';

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
const ITEMS_PER_PAGE = 10;

const RevenueCharts = ({ dailyData, weeklyData, batchData }: RevenueChartsProps) => {
  const [allRevenueData, setAllRevenueData] = useState<Array<{ dia: string; receita_bruta: number; receita_liquida: number }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchAllRevenueData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('v_fin_receita_diaria')
          .select('*')
          .eq('currency', 'BRL')
          .order('dia', { ascending: false });

        if (error) {
          console.error('Erro ao buscar dados de receita:', error);
          // Define array vazio em caso de erro para evitar estado undefined
          setAllRevenueData([]);
        } else {
          // Normaliza: sempre array, nunca null/undefined
          setAllRevenueData(data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        // Fallback seguro para não quebrar UI
        setAllRevenueData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRevenueData();
  }, []);

  const totalPages = Math.ceil(allRevenueData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentData = allRevenueData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Faturamento por Dia (Período Selecionado)</CardTitle>
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
          <div className="w-full space-y-4">
            <div className="flex justify-center">
              <div className="grid grid-cols-1 gap-2 text-sm">
                {batchData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{entry.name}:</span>
                    <span>{formatCurrency(entry.faturamento)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full h-[200px] flex items-center justify-center">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={batchData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
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
          </div>
        </CardContent>
      </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">Tendências Temporais - Todas as Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando dados...</div>
          ) : allRevenueData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum dado de receita encontrado</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Data</TableHead>
                      <TableHead className="text-right">Receita Bruta</TableHead>
                      <TableHead className="text-right">Receita Líquida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((row, index) => (
                      <TableRow key={`${row.dia}-${index}`}>
                        <TableCell className="font-medium">
                          {new Date(row.dia).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.receita_bruta)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.receita_liquida)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, allRevenueData.length)} de {allRevenueData.length} registros
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === '...' ? (
                            <span className="px-4">...</span>
                          ) : (
                            <PaginationLink
                              onClick={() => handlePageChange(page as number)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueCharts;

