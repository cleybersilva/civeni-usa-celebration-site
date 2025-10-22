
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStripeDashboard } from '@/hooks/useStripeDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, CreditCard, DollarSign, Users, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [range, setRange] = useState('30d');
  const { summary, timeseries, byBrand, funnel, charges, loading, refresh } = useStripeDashboard(range);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro Stripe</h2>
          <p className="text-muted-foreground">Espelho em tempo real • Civeni 2025</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refresh} disabled={loading} size="icon" variant="outline">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.liquido || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Taxas: {formatCurrency(summary?.taxas || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscrições Pagas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pagos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Conversão: {summary?.taxaConversao || '0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.ticketMedio || 0)}</div>
            <p className="text-xs text-muted-foreground">Por transação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.disputas || 0}</div>
            <p className="text-xs text-muted-foreground">
              Falhas: {summary?.falhas || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transacoes">
        <TabsList>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="bandeiras">Por Bandeira</TabsTrigger>
          <TabsTrigger value="funil">Funil</TabsTrigger>
        </TabsList>

        <TabsContent value="transacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {charges.slice(0, 10).map((charge: any) => (
                  <div key={charge.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{charge.participante}</p>
                      <p className="text-xs text-muted-foreground">{charge.data_hora_brt}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(charge.valor_liquido)}</p>
                      <p className="text-xs text-muted-foreground">{charge.bandeira} {charge.last4}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bandeiras">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Bandeira</CardTitle>
            </CardHeader>
            <CardContent>
              {byBrand.map((item: any) => (
                <div key={`${item.bandeira}-${item.funding}`} className="flex justify-between py-2 border-b">
                  <span>{item.bandeira} ({item.funding})</span>
                  <span className="font-bold">{formatCurrency(item.receita_liquida)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funil">
          <Card>
            <CardHeader>
              <CardTitle>Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              {funnel?.steps?.map((step: any) => (
                <div key={step.step} className="py-2">
                  <div className="flex justify-between mb-1">
                    <span>{step.step}</span>
                    <span>{step.count} ({step.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${step.percentage}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
