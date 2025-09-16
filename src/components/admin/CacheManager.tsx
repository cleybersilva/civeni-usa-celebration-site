import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { forceCacheUpdate, CachePurgeResult } from '@/utils/cacheUtils';
import { toast } from 'sonner';

interface CacheManagerProps {
  className?: string;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ className = '' }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<CachePurgeResult | null>(null);
  const [updateHistory, setUpdateHistory] = useState<Array<CachePurgeResult & { timestamp: Date }>>([]);

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    toast.info('Iniciando atualização de cache...');
    
    try {
      const result = await forceCacheUpdate();
      setLastUpdate(result);
      
      // Adicionar ao histórico
      setUpdateHistory(prev => [
        { ...result, timestamp: new Date() },
        ...prev.slice(0, 4) // Manter apenas últimas 5 entradas
      ]);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar cache: ${errorMessage}`);
      setLastUpdate({
        success: false,
        message: errorMessage,
        affectedUrls: []
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Gerenciador de Cache de Imagens
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Force a atualização do cache para garantir que as imagens mais recentes sejam exibidas no site.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Ações principais */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleForceUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2"
            size="lg"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Atualizando Cache...' : 'Forçar Atualização Global'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar Página
          </Button>
        </div>

        {/* Status da última atualização */}
        {lastUpdate && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Última Atualização
              </h4>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(lastUpdate.success)}
                <Badge variant={lastUpdate.success ? 'default' : 'destructive'}>
                  {lastUpdate.success ? 'Sucesso' : 'Erro'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {lastUpdate.message}
                </span>
              </div>

              {lastUpdate.affectedUrls.length > 0 && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">
                    URLs atualizadas: {lastUpdate.affectedUrls.length}
                  </p>
                  <div className="max-h-32 overflow-y-auto bg-muted p-2 rounded text-xs">
                    {lastUpdate.affectedUrls.slice(0, 10).map((url, index) => (
                      <div key={index} className="truncate">
                        {url}
                      </div>
                    ))}
                    {lastUpdate.affectedUrls.length > 10 && (
                      <div className="text-muted-foreground">
                        ... e mais {lastUpdate.affectedUrls.length - 10} URLs
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Histórico de atualizações */}
        {updateHistory.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Histórico Recente</h4>
              <div className="space-y-2">
                {updateHistory.map((update, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(update.success)}
                      <span className="text-sm">{update.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(update.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Informações adicionais */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Como funciona:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Adiciona timestamps únicos às URLs das imagens</li>
            <li>• Força os navegadores a recarregarem as imagens</li>
            <li>• Purga o cache do CDN quando configurado</li>
            <li>• Atualiza automaticamente as páginas do site</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};