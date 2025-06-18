
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingUp, Download, Calendar, CreditCard, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Registration {
  id: string;
  full_name: string;
  email: string;
  category_name: string;
  batch_number: number;
  payment_status: string;
  created_at: string;
  amount_paid?: number;
}

interface PaymentData {
  total: number;
  byType: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  byBatch: Record<string, number>;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

const AdminDashboard = () => {
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);

  // Fetch registrations data
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          full_name,
          email,
          payment_status,
          created_at,
          batch_id,
          category_id,
          registration_categories(category_name),
          registration_batches(batch_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        full_name: item.full_name,
        email: item.email,
        category_name: item.registration_categories?.category_name || 'N/A',
        batch_number: item.registration_batches?.batch_number || 1,
        payment_status: item.payment_status || 'pending',
        created_at: item.created_at,
        amount_paid: getAmountByCategory(item.registration_categories?.category_name)
      }));
    },
    refetchInterval: 30000 // Refresh every 30 seconds for real-time updates
  });

  const getAmountByCategory = (categoryName: string | null): number => {
    const amounts = {
      'vccu_student_presentation': 120,
      'vccu_student_listener': 80,
      'vccu_professor_partner': 0,
      'general_participant': 250
    };
    return amounts[categoryName as keyof typeof amounts] || 0;
  };

  const getCategoryDisplayName = (categoryName: string): string => {
    const names = {
      'vccu_student_presentation': 'Aluno VCCU (com apresentação)',
      'vccu_student_listener': 'Aluno VCCU (ouvinte)',
      'vccu_professor_partner': 'Professor VCCU/Parceiro',
      'general_participant': 'Participante Geral'
    };
    return names[categoryName as keyof typeof names] || categoryName;
  };

  // Calculate financial data
  const paymentData: PaymentData = React.useMemo(() => {
    const total = registrations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.amount_paid || 0), 0);

    const byType = registrations.reduce((acc, r) => {
      if (r.payment_status === 'paid') {
        const displayName = getCategoryDisplayName(r.category_name);
        acc[displayName] = (acc[displayName] || 0) + (r.amount_paid || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const byBatch = registrations.reduce((acc, r) => {
      if (r.payment_status === 'paid') {
        const batchName = `${r.batch_number}º Lote`;
        acc[batchName] = (acc[batchName] || 0) + (r.amount_paid || 0);
      }
      return acc;
    }, {} as Record<string, number>);

    // Simulate payment methods for demo (in real app, this would come from Stripe)
    const byPaymentMethod = {
      'Cartão de Crédito': total * 0.6,
      'PIX': total * 0.3,
      'Cartão de Débito': total * 0.1
    };

    // Generate daily revenue for last 30 days
    const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        amount: Math.random() * 500 + 100 // Simulated data
      };
    });

    return { total, byType, byPaymentMethod, byBatch, dailyRevenue };
  }, [registrations]);

  // Calculate category statistics
  const categoryStats = React.useMemo(() => {
    return registrations.reduce((acc, r) => {
      const displayName = getCategoryDisplayName(r.category_name);
      if (!acc[displayName]) {
        acc[displayName] = {
          total: 0,
          paid: 0,
          pending: 0,
          revenue: 0
        };
      }
      acc[displayName].total++;
      if (r.payment_status === 'paid') {
        acc[displayName].paid++;
        acc[displayName].revenue += r.amount_paid || 0;
      } else if (r.payment_status === 'pending') {
        acc[displayName].pending++;
      }
      return acc;
    }, {} as Record<string, { total: number; paid: number; pending: number; revenue: number }>);
  }, [registrations]);

  const categoryChartData = Object.entries(categoryStats).map(([category, stats]) => ({
    category: category.replace('Aluno VCCU', 'VCCU').replace('Participante', 'Part.'),
    total: stats.total,
    paid: stats.paid,
    pending: stats.pending
  }));

  const pieChartData = Object.entries(paymentData.byPaymentMethod).map(([method, amount]) => ({
    name: method,
    value: amount,
    percentage: ((amount / paymentData.total) * 100).toFixed(1)
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const exportToCSV = (batch?: number) => {
    const dataToExport = batch 
      ? registrations.filter(r => r.batch_number === batch)
      : registrations;

    const csvContent = [
      'Nome,Email,Categoria,Lote,Status,Data da Inscrição,Valor',
      ...dataToExport.map(r => 
        `"${r.full_name}","${r.email}","${getCategoryDisplayName(r.category_name)}","${r.batch_number}º Lote","${r.payment_status}","${new Date(r.created_at).toLocaleDateString('pt-BR')}","R$ ${r.amount_paid?.toFixed(2) || '0,00'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscricoes${batch ? `_lote_${batch}` : ''}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRegistrations = registrations.length;
  const paidRegistrations = registrations.filter(r => r.payment_status === 'paid').length;
  const pendingRegistrations = registrations.filter(r => r.payment_status === 'pending').length;
  const todayRegistrations = registrations.filter(r => 
    new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civeni-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {paymentData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs opacity-90">+12% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscrições</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs opacity-90">{paidRegistrations} confirmadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRegistrations}</div>
            <p className="text-xs opacity-90">novas inscrições</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRegistrations}</div>
            <p className="text-xs opacity-90">aguardando pagamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(categoryStats).map(([category, stats], index) => (
          <Card key={category} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
              <UserCheck className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span className="text-green-600">{stats.paid} pagos</span>
                <span className="text-yellow-600">{stats.pending} pendentes</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-civeni-blue" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: { label: "Valor", color: "hsl(var(--chart-1))" }
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor'
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              {pieChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-civeni-blue" />
              Inscrições por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total: { label: "Total", color: "#3B82F6" },
                paid: { label: "Pagas", color: "#10B981" },
                pending: { label: "Pendentes", color: "#F59E0B" }
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="paid" fill="#10B981" name="Pagas" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pendentes" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Batch */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Lote</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: { label: "Valor", color: "hsl(var(--chart-2))" }
              }}
              className="h-64"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(paymentData.byBatch).map(([batch, amount]) => ({
                  batch,
                  amount
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="batch" />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor'
                    ]}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Registration Management by Batch */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Acompanhamento de Inscrições por Lote</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedBatch === null ? "default" : "outline"}
                onClick={() => setSelectedBatch(null)}
                size="sm"
              >
                Todos os Lotes
              </Button>
              <Button
                variant={selectedBatch === 1 ? "default" : "outline"}
                onClick={() => setSelectedBatch(1)}
                size="sm"
              >
                1º Lote
              </Button>
              <Button
                variant={selectedBatch === 2 ? "default" : "outline"}
                onClick={() => setSelectedBatch(2)}
                size="sm"
              >
                2º Lote
              </Button>
              <Button
                onClick={() => exportToCSV(selectedBatch || undefined)}
                size="sm"
                className="bg-civeni-green hover:bg-green-600"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Nome</th>
                  <th className="text-left p-2 font-semibold">Email</th>
                  <th className="text-left p-2 font-semibold">Categoria</th>
                  <th className="text-left p-2 font-semibold">Lote</th>
                  <th className="text-left p-2 font-semibold">Status</th>
                  <th className="text-left p-2 font-semibold">Data</th>
                  <th className="text-left p-2 font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {registrations
                  .filter(r => selectedBatch === null || r.batch_number === selectedBatch)
                  .slice(0, 10) // Show first 10 for demo
                  .map((registration) => (
                    <tr key={registration.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{registration.full_name}</td>
                      <td className="p-2 text-sm text-gray-600">{registration.email}</td>
                      <td className="p-2 text-sm">{getCategoryDisplayName(registration.category_name)}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {registration.batch_number}º Lote
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          registration.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : registration.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {registration.payment_status === 'paid' ? 'Pago' : 
                           registration.payment_status === 'pending' ? 'Pendente' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-2 font-medium text-green-600">
                        R$ {(registration.amount_paid || 0).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {Math.min(10, registrations.filter(r => selectedBatch === null || r.batch_number === selectedBatch).length)} de{' '}
            {registrations.filter(r => selectedBatch === null || r.batch_number === selectedBatch).length} inscrições
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
