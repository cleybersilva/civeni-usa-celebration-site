import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Calendar, Users, MonitorSpeaker, ExternalLink } from 'lucide-react';
import { useCiveniOnlineProgramData } from '@/hooks/useCiveniOnlineProgramData';
import { useCiveniScheduleOperations, CiveniDay, CiveniDayUpdate } from './schedule/useCiveniScheduleOperations';
import CiveniDayFormDialog from './schedule/CiveniDayFormDialog';

const CiveniOnlineProgramManager = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('days');
  const { settings, days, sessions, isLoading, getSessionsForDay } = useCiveniOnlineProgramData();
  const { dayUpsertMutation } = useCiveniScheduleOperations();

  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<CiveniDay | null>(null);

  const handleOpenDayDialog = (day?: CiveniDay) => {
    setEditingDay(day || null);
    setIsDayDialogOpen(true);
  };

  const handleCloseDayDialog = () => {
    setIsDayDialogOpen(false);
    setEditingDay(null);
  };

  const handleSaveDay = (formData: CiveniDayUpdate) => {
    dayUpsertMutation.mutate(
      {
        formData,
        editingDay,
        type: 'online'
      },
      {
        onSuccess: () => {
          handleCloseDayDialog();
        }
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const match = timeString.match(/T(\d{2}:\d{2})| (\d{2}:\d{2})/);
    if (match) {
      return match[1] || match[2];
    }
    return timeString;
  };

  const getSessionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'conferencia': 'bg-blue-100 text-blue-800',
      'palestra': 'bg-green-100 text-green-800',
      'workshop': 'bg-purple-100 text-purple-800',
      'mesa_redonda': 'bg-orange-100 text-orange-800',
      'painel': 'bg-yellow-100 text-yellow-800',
      'sessoes_simultaneas': 'bg-pink-100 text-pink-800',
      'intervalo': 'bg-gray-100 text-gray-800',
      'abertura': 'bg-indigo-100 text-indigo-800',
      'encerramento': 'bg-red-100 text-red-800',
      'credenciamento': 'bg-teal-100 text-teal-800',
      'cerimonia': 'bg-purple-100 text-purple-800',
      'outro': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getModalityColor = (modality: string) => {
    const colors: Record<string, string> = {
      'presencial': 'bg-emerald-100 text-emerald-800',
      'online': 'bg-blue-100 text-blue-800',
      'hibrido': 'bg-amber-100 text-amber-800'
    };
    return colors[modality] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Programação Online CIVENI</h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MonitorSpeaker className="w-8 h-8" />
            Gerenciar Programação Online CIVENI
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure dias, sessões e configurações da programação online
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/programacao-online" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Página Online
          </a>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="days">
            <Calendar className="w-4 h-4 mr-2" />
            Dias ({days?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Users className="w-4 h-4 mr-2" />
            Sessões ({sessions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="speakers">
            <Users className="w-4 h-4 mr-2" />
            Palestrantes
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="days">
          <Card className="p-0 overflow-hidden rounded-lg">
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-civeni-blue via-civeni-red to-civeni-blue rounded-t-lg text-white">
              <h2 className="text-xl font-semibold">Dias da Programação Online</h2>
              <Button onClick={() => handleOpenDayDialog()} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Dia
              </Button>
            </div>
            <div className="p-6">

            <div className="space-y-4">
              {days?.map((day) => (
                <Card key={day.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{day.weekday_label}</h3>
                        <Badge variant={day.is_published ? "default" : "secondary"}>
                          {day.is_published ? "Publicado" : "Rascunho"}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          Online
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {formatDate(day.date)}
                      </p>
                      <p className="font-medium">{day.headline}</p>
                      <p className="text-sm text-muted-foreground">{day.theme}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getSessionsForDay(day.id).length} sessões
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenDayDialog(day)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline">
                        Sessões
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {!days?.length && (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum dia configurado ainda</p>
                </div>
              )}
            </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="p-0 overflow-hidden rounded-lg">
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-civeni-blue via-civeni-red to-civeni-blue rounded-t-lg text-white">
              <h2 className="text-xl font-semibold">Sessões Online</h2>
              <Button variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Sessão
              </Button>
            </div>
            <div className="p-6">

            <div className="space-y-4">
              {days?.map((day) => {
                const daySessions = getSessionsForDay(day.id);
                if (!daySessions.length) return null;

                return (
                  <div key={day.id} className="overflow-hidden rounded-lg border shadow-sm">
                    <div className="bg-gradient-to-r from-civeni-blue via-civeni-red to-civeni-blue p-4 flex items-center justify-center gap-2 text-white">
                      <h3 className="font-semibold text-lg">
                        {day.weekday_label} - {formatDate(day.date)}
                      </h3>
                      <Badge className="bg-white/20 text-white border-white/30">Online</Badge>
                    </div>
                    <div className="space-y-2 p-4">
                      {daySessions.map((session) => (
                        <Card key={session.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm">
                                  {formatTime(session.start_at)}
                                  {session.end_at && ` - ${formatTime(session.end_at)}`}
                                </span>
                                <Badge className={getSessionTypeColor(session.session_type)}>
                                  {session.session_type}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800">
                                  online
                                </Badge>
                                {session.is_parallel && (
                                  <Badge variant="outline">Simultânea</Badge>
                                )}
                                {session.is_featured && (
                                  <Badge variant="secondary">Destaque</Badge>
                                )}
                                <Badge variant={session.is_published ? "default" : "secondary"}>
                                  {session.is_published ? "Publicado" : "Rascunho"}
                                </Badge>
                              </div>
                              <h4 className="font-medium mb-1">{session.title}</h4>
                              {session.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {session.description}
                                </p>
                              )}
                              {session.room && (
                                <p className="text-xs text-muted-foreground">
                                  📍 {session.room}
                                </p>
                              )}
                              {session.livestream_url && (
                                <p className="text-xs text-blue-600 mt-1">
                                  🔗 Link de transmissão configurado
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Editar
                              </Button>
                              <Button size="sm" variant="outline">
                                Duplicar
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {!sessions?.length && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma sessão configurada ainda</p>
                </div>
              )}
            </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="speakers">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Palestrantes Online</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Palestrante
              </Button>
            </div>

            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Funcionalidade de palestrantes em desenvolvimento</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Configurações da Página Online</h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Título da Página</label>
                <p className="text-sm text-muted-foreground mb-2">
                  Exibido no cabeçalho da página de programação online
                </p>
                <div className="p-3 bg-muted rounded">
                  {settings?.page_title || 'Programação Online'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Subtítulo</label>
                <p className="text-sm text-muted-foreground mb-2">
                  Descrição exibida abaixo do título
                </p>
                <div className="p-3 bg-muted rounded">
                  {settings?.page_subtitle || 'Confira toda a programação online do III CIVENI 2025'}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Botão "Baixar Programação"</p>
                  <p className="text-sm text-muted-foreground">
                    Exibir botão para download da programação online
                  </p>
                </div>
                <Badge variant={settings?.show_download_pdf ? "default" : "secondary"}>
                  {settings?.show_download_pdf ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Botão "Adicionar ao Calendário"</p>
                  <p className="text-sm text-muted-foreground">
                    Exibir botão para adicionar eventos ao calendário
                  </p>
                </div>
                <Badge variant={settings?.show_add_to_calendar ? "default" : "secondary"}>
                  {settings?.show_add_to_calendar ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Editar Configurações
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <CiveniDayFormDialog
        isOpen={isDayDialogOpen}
        onClose={handleCloseDayDialog}
        onSubmit={handleSaveDay}
        editingDay={editingDay}
        isLoading={dayUpsertMutation.isPending}
        type="online"
      />
    </div>
  );
};

export default CiveniOnlineProgramManager;