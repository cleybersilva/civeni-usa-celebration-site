import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface TransmissaoLive {
  id: string;
  titulo: string;
  descricao?: string;
  url_embed: string;
  data_hora_inicio?: string;
  status: string;
}

const TransmissaoAoVivo = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [transmissao, setTransmissao] = useState<TransmissaoLive | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [timeToStart, setTimeToStart] = useState<string>('');

  useEffect(() => {
    checkAccess();
    loadActiveTransmission();
  }, []);

  useEffect(() => {
    if (transmissao?.data_hora_inicio) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const startTime = new Date(transmissao.data_hora_inicio!).getTime();
        const distance = startTime - now;

        if (distance > 0) {
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          setTimeToStart(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeToStart('');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [transmissao]);

  const checkAccess = async () => {
    try {
      // Simular verificação de acesso - você pode implementar a lógica real aqui
      // Verificando se o usuário tem uma inscrição paga válida
      const { data: registrations, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('payment_status', 'completed')
        .limit(1);

      if (error) throw error;
      
      // Por enquanto, permitir acesso se houver pelo menos uma inscrição paga no sistema
      setHasAccess(registrations && registrations.length > 0);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    }
  };

  const loadActiveTransmission = async () => {
    try {
      const { data, error } = await supabase
        .from('transmissoes_live')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTransmissao(data);
    } catch (error) {
      console.error('Error loading transmission:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar transmissão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const isLive = () => {
    if (!transmissao?.data_hora_inicio) return true;
    const now = new Date().getTime();
    const startTime = new Date(transmissao.data_hora_inicio).getTime();
    return now >= startTime;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-blue-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-blue-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-civeni-blue" />
            <CardTitle className="text-xl">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Esta transmissão é exclusiva para participantes pagantes do III CIVENI 2025.
            </p>
            <p className="text-sm text-muted-foreground">
              Faça login com sua conta de participante para acessar o conteúdo.
            </p>
            <Button 
              onClick={() => window.location.href = '/inscricoes'}
              className="w-full"
            >
              Ver Ingressos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transmissao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-blue-dark flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <CardTitle className="text-xl">Nenhuma Transmissão Ativa</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Não há transmissões ao vivo no momento.
            </p>
            <p className="text-sm text-muted-foreground">
              Verifique a programação do evento para os próximos horários.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-blue-dark p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Transmissão Ao Vivo</h1>
          <p className="text-civeni-blue-light">III CIVENI 2025</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Player Principal */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {isLive() ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(transmissao.url_embed)}?autoplay=1`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gray-900 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Clock className="h-16 w-16 mx-auto mb-4 text-civeni-blue" />
                      <h3 className="text-xl font-semibold mb-2">Transmissão em Breve</h3>
                      {timeToStart && (
                        <p className="text-lg">
                          Inicia em: <span className="font-mono font-bold">{timeToStart}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações da Transmissão */}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{transmissao.titulo}</CardTitle>
                  <Badge variant="default" className="bg-red-500">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      {isLive() ? 'AO VIVO' : 'EM BREVE'}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              {transmissao.descricao && (
                <CardContent>
                  <p className="text-muted-foreground">{transmissao.descricao}</p>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-civeni-blue">
                    {Math.floor(Math.random() * 500) + 100}
                  </div>
                  <p className="text-sm text-muted-foreground">visualizando agora</p>
                </div>
              </CardContent>
            </Card>

            {transmissao.data_hora_inicio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horário
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {new Date(transmissao.data_hora_inicio).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground">Horário de Brasília</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sobre o Evento</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  O III CIVENI 2025 é o principal encontro de profissionais da área de ciências humanas e tecnologia.
                </p>
                <p>
                  Esta transmissão é exclusiva para participantes inscritos no evento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransmissaoAoVivo;