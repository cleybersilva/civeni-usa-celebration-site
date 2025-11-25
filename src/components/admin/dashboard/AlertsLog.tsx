
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, AlertTriangle, TrendingUp, RefreshCw, Filter, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AlertLog {
  id: string;
  alert_type: string;
  recipient_type: string;
  recipient: string;
  message: string;
  status: string;
  created_at: string;
  triggered_by_id?: string;
}

interface AlertStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  byType: { [key: string]: number };
  recent: number;
}

interface AlertsLogProps {
  alerts: AlertLog[];
}

const AlertsLog: React.FC<AlertsLogProps> = ({ alerts }) => {
  const { t } = useTranslation();
  const [allAlerts, setAllAlerts] = useState<AlertLog[]>(alerts);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertLog[]>(alerts);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setAllAlerts(alerts);
    calculateStats(alerts);
    applyFilters(alerts);
  }, [alerts]);

  useEffect(() => {
    applyFilters(allAlerts);
  }, [filter, searchTerm, allAlerts]);

  const calculateStats = (alertList: AlertLog[]) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const byType: { [key: string]: number } = {};
    let sent = 0, pending = 0, failed = 0, recent = 0;

    alertList.forEach(alert => {
      // Count by status
      if (alert.status === 'sent') sent++;
      else if (alert.status === 'pending') pending++;
      else if (alert.status === 'failed') failed++;

      // Count by type
      byType[alert.alert_type] = (byType[alert.alert_type] || 0) + 1;

      // Count recent alerts (last 24h)
      if (new Date(alert.created_at) > last24Hours) recent++;
    });

    setStats({
      total: alertList.length,
      sent,
      pending,
      failed,
      byType,
      recent
    });
  };

  const applyFilters = (alertList: AlertLog[]) => {
    let filtered = alertList;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(alert => alert.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.recipient.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAlerts(filtered);
  };

  const refreshAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alert_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const alertData = (data || []) as AlertLog[];
      setAllAlerts(alertData);
      calculateStats(alertData);

      toast({
        title: "Alertas Atualizados",
        description: `${alertData.length} alertas carregados`
      });
    } catch (error) {
      console.error('Erro ao atualizar alertas:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar alertas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'new_registration':
        return <Users className="w-4 h-4" />;
      case 'payment_completed':
        return <DollarSign className="w-4 h-4" />;
      case 'daily_report':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels = {
      'new_registration': 'Nova Inscrição',
      'payment_completed': 'Pagamento Confirmado',
      'daily_report': 'Relatório Diário',
      'batch_started': 'Lote Iniciado',
      'batch_ended': 'Lote Encerrado',
      'system_alert': 'Alerta do Sistema'
    };
    return labels[alertType as keyof typeof labels] || alertType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">Total de Alertas</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-green-600 font-medium truncate">Enviados</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900">{stats.sent}</p>
                </div>
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-yellow-600 font-medium truncate">Pendentes</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-purple-600 font-medium truncate">Últimas 24h</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900">{stats.recent}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="recent" className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <TabsList className="w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger value="recent" className="text-xs sm:text-sm">Alertas Recentes</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Análise</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm flex-1 sm:w-48"
              />
            </div>
            
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="sent">Enviados</option>
              <option value="pending">Pendentes</option>
              <option value="failed">Falharam</option>
            </select>
            
            <Button onClick={refreshAlerts} variant="outline" size="sm" disabled={loading} className="text-xs sm:text-sm">
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        <TabsContent value="recent">
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Lista de Alertas ({filteredAlerts.length} alertas)</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                {filteredAlerts.length === 0 ? (
                  <p className="text-muted-foreground bg-gray-100 p-3 sm:p-4 rounded-lg text-center text-sm">
                    Nenhum alerta encontrado com os filtros aplicados
                  </p>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 border rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all duration-300 shadow-sm hover:shadow-md">
                      <div className="mt-0.5 p-1.5 sm:p-2 rounded-full bg-blue-100 flex-shrink-0">
                        {getAlertIcon(alert.alert_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="font-medium text-xs sm:text-sm text-gray-800 truncate">
                            {getAlertTypeLabel(alert.alert_type)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground bg-gray-200 px-2 py-1 rounded-full whitespace-nowrap">
                            {new Date(alert.created_at).toLocaleString('pt-BR', { 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                          <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                            {alert.recipient_type.toUpperCase()}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full truncate max-w-[120px] sm:max-w-none">
                            {alert.recipient}
                          </span>
                          <span className={`text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Análise de Alertas</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Distribuição por Tipo</h4>
                  <div className="space-y-2">
                    {stats && Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>{getAlertTypeLabel(type)}</span>
                        <span className="font-bold text-gray-700">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Status de Entrega</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span>Enviados com Sucesso</span>
                      <span className="font-bold text-green-700">{stats?.sent || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span>Pendentes</span>
                      <span className="font-bold text-yellow-700">{stats?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span>Falharam</span>
                      <span className="font-bold text-red-700">{stats?.failed || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertsLog;
