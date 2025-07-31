import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  Monitor,
  Wifi,
  WifiOff 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCMS } from '@/contexts/CMSContext';

interface SyncStatus {
  section: string;
  sectionLabel: string;
  lastSync: string | null;
  status: 'synced' | 'outdated' | 'error' | 'never';
  recordCount: number;
  hasChanges: boolean;
}

const SyncManager = () => {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const { toast } = useToast();
  const { content } = useCMS();

  const sections = [
    { key: 'banner_slides', label: 'Banner Principal', table: 'banner_slides' },
    { key: 'event_config', label: 'Configuração do Evento', table: 'event_config' },
    { key: 'partners', label: 'Parceiros', table: 'partners' },
    { key: 'schedules', label: 'Programação', table: 'schedules' },
    { key: 'event_registrations', label: 'Inscrições', table: 'event_registrations' },
    { key: 'registration_categories', label: 'Categorias de Inscrição', table: 'registration_categories' },
    { key: 'registration_batches', label: 'Lotes de Inscrição', table: 'registration_batches' },
    { key: 'coupon_codes', label: 'Cupons de Desconto', table: 'coupon_codes' }
  ];

  useEffect(() => {
    checkConnectionStatus();
    fetchSyncStatuses();
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(fetchSyncStatuses, 30000);
    
    // Verificar conexão a cada 5 segundos
    const connectionInterval = setInterval(checkConnectionStatus, 5000);
    
    return () => {
      clearInterval(interval);
      clearInterval(connectionInterval);
    };
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { error } = await supabase.from('banner_slides').select('id').limit(1);
      setConnectionStatus(error ? 'offline' : 'online');
    } catch {
      setConnectionStatus('offline');
    }
  };

  const fetchSyncStatuses = async () => {
    try {
      const statuses: SyncStatus[] = [];

      for (const section of sections) {
        try {
          // Verificar se a tabela existe e obter dados
          const { data, error, count } = await supabase
            .from(section.table as any)
            .select('*', { count: 'exact' })
            .limit(1);

          let status: SyncStatus['status'] = 'synced';
          let lastSync: string | null = null;
          
          if (error) {
            status = 'error';
          } else if (count === 0) {
            status = 'never';
          } else {
            // Para tabelas que têm updated_at, verificar timestamp
            if (['banner_slides', 'event_config', 'partners', 'schedules'].includes(section.key)) {
              try {
                const { data: latestData } = await supabase
                  .from(section.table as any)
                  .select('updated_at')
                  .order('updated_at', { ascending: false })
                  .limit(1);

                if (latestData && latestData.length > 0 && (latestData[0] as any).updated_at) {
                  lastSync = (latestData[0] as any).updated_at;
                  
                  // Verificar se há atualizações recentes (últimos 5 minutos)
                  const lastUpdate = new Date((latestData[0] as any).updated_at);
                  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                  
                  if (lastUpdate > fiveMinutesAgo) {
                    status = 'outdated';
                  }
                }
              } catch (updateError) {
                console.warn(`Erro ao verificar updated_at para ${section.key}:`, updateError);
              }
            } else {
              // Para tabelas sem updated_at, verificar created_at
              try {
                const { data: latestData } = await supabase
                  .from(section.table as any)
                  .select('created_at')
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (latestData && latestData.length > 0 && (latestData[0] as any).created_at) {
                  lastSync = (latestData[0] as any).created_at;
                }
              } catch (createError) {
                console.warn(`Erro ao verificar created_at para ${section.key}:`, createError);
              }
            }
          }

          statuses.push({
            section: section.key,
            sectionLabel: section.label,
            lastSync,
            status,
            recordCount: count || 0,
            hasChanges: status === 'outdated'
          });

        } catch (error) {
          console.error(`Erro ao verificar seção ${section.key}:`, error);
          statuses.push({
            section: section.key,
            sectionLabel: section.label,
            lastSync: null,
            status: 'error',
            recordCount: 0,
            hasChanges: false
          });
        }
      }

      setSyncStatuses(statuses);
    } catch (error) {
      console.error('Erro ao buscar status de sincronização:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar status de sincronização",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncSection = async (section: string) => {
    setSyncing(true);
    try {
      // Invalidar cache e forçar recarregamento
      const { error } = await supabase
        .from(section as any)
        .select('*')
        .limit(1);

      if (error) throw error;

      await fetchSyncStatuses();
      
      toast({
        title: "Sincronização Concluída",
        description: `Seção ${sections.find(s => s.key === section)?.label} sincronizada com sucesso!`
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: "Erro na Sincronização",
        description: "Erro ao sincronizar dados",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      for (const section of sections) {
        await syncSection(section.key);
      }
      
      toast({
        title: "Sincronização Global Concluída",
        description: "Todas as seções foram sincronizadas com sucesso!"
      });
    } catch (error) {
      console.error('Erro na sincronização global:', error);
      toast({
        title: "Erro na Sincronização Global",
        description: "Erro ao sincronizar todas as seções",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'outdated':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'never':
        return <Database className="w-4 h-4 text-gray-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sincronizado</Badge>;
      case 'outdated':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Desatualizado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'never':
        return <Badge variant="outline">Nunca Sincronizado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Nunca';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dias atrás`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Verificando status de sincronização...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outdatedSections = syncStatuses.filter(s => s.status === 'outdated' || s.status === 'error');
  const syncedSections = syncStatuses.filter(s => s.status === 'synced');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sincronização Site ↔ Dashboard</h2>
        <div className="flex items-center gap-2">
          {connectionStatus === 'online' ? (
            <div className="flex items-center gap-2 text-green-600">
              <Wifi className="w-4 h-4" />
              <span className="text-sm">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sincronizadas</p>
                <p className="text-2xl font-bold">{syncedSections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{outdatedSections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Seções</p>
                <p className="text-2xl font-bold">{syncStatuses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Ações de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={syncAll} 
              disabled={syncing || connectionStatus === 'offline'}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Tudo'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={fetchSyncStatuses}
              disabled={loading}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Verificar Status
            </Button>
          </div>

          {outdatedSections.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {outdatedSections.length} seção(ões) precisa(m) de sincronização.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status Detalhado por Seção */}
      <Card>
        <CardHeader>
          <CardTitle>Status Detalhado das Seções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {syncStatuses.map((section, index) => (
              <div key={section.section}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(section.status)}
                    <div>
                      <p className="font-medium">{section.sectionLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        {section.recordCount} registros • Última sync: {formatLastSync(section.lastSync)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(section.status)}
                    
                    {(section.status === 'outdated' || section.status === 'error') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncSection(section.section)}
                        disabled={syncing || connectionStatus === 'offline'}
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                        Sincronizar
                      </Button>
                    )}
                  </div>
                </div>
                
                {index < syncStatuses.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Status da Conexão:</span>
            <span className={connectionStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
              {connectionStatus === 'online' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Última Verificação:</span>
            <span>{new Date().toLocaleTimeString('pt-BR')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Verificação Automática:</span>
            <span>A cada 30 segundos</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncManager;