import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Calendar, Users, Trash2, Eye, EyeOff } from 'lucide-react';
import { useCiveniProgramData } from '@/hooks/useCiveniProgramData';
import { useCiveniScheduleOperations, CiveniDay, EventType } from '@/components/admin/schedule/useCiveniScheduleOperations';
import CiveniDayFormDialog from '@/components/admin/schedule/CiveniDayFormDialog';
import CiveniSessionFormDialog from '@/components/admin/schedule/CiveniSessionFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CiveniProgramManager = () => {
  const { t } = useTranslation();
  const type: EventType = 'presencial'; // Fixed to presencial for this manager
  const [activeTab, setActiveTab] = useState('days');
  const { settings, isLoading: settingsLoading } = useCiveniProgramData();
  
  // Use the schedule operations hook
  const {
    useDays,
    useSessions,
    dayUpsertMutation,
    deleteDayMutation,
    togglePublishDayMutation,
    sessionUpsertMutation,
    deleteSessionMutation,
    togglePublishSessionMutation,
  } = useCiveniScheduleOperations();

  const { data: days, isLoading: daysLoading } = useDays(type);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(type);
  
  // State for day dialog
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<CiveniDay | null>(null);
  const [dayToDelete, setDayToDelete] = useState<string | null>(null);
  
  // State for session dialog
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  const isLoading = settingsLoading || daysLoading || sessionsLoading;

  // Day handlers
  const handleCreateDay = () => {
    setEditingDay(null);
    setIsDayDialogOpen(true);
  };

  const handleEditDay = (day: CiveniDay) => {
    setEditingDay(day);
    setIsDayDialogOpen(true);
  };

  const handleSaveDay = (formData: any) => {
    console.log('handleSaveDay chamado com:', formData);
    console.log('editingDay:', editingDay);
    
    dayUpsertMutation.mutate(
      { formData, editingDay, type },
      {
        onSuccess: () => {
          console.log('Dia salvo com sucesso, fechando dialog');
          setIsDayDialogOpen(false);
          setEditingDay(null);
        },
        onError: (error) => {
          console.error('Erro ao salvar dia:', error);
        }
      }
    );
  };

  const handleDeleteDay = (dayId: string) => {
    setDayToDelete(dayId);
  };

  const confirmDeleteDay = () => {
    if (dayToDelete) {
      deleteDayMutation.mutate(
        { id: dayToDelete, type },
        {
          onSuccess: () => {
            setDayToDelete(null);
          },
        }
      );
    }
  };

  const handleTogglePublishDay = (dayId: string, currentStatus: boolean) => {
    togglePublishDayMutation.mutate({
      id: dayId,
      is_published: !currentStatus,
      type,
    });
  };

  // Session handlers
  const handleCreateSession = (dayId?: string) => {
    setEditingSession(null);
    setIsSessionDialogOpen(true);
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setIsSessionDialogOpen(true);
  };

  const handleSaveSession = (formData: any) => {
    console.log('handleSaveSession chamado com:', formData);
    console.log('editingSession:', editingSession);
    
    sessionUpsertMutation.mutate(
      { formData, editingSession, type },
      {
        onSuccess: () => {
          console.log('Sessão salva com sucesso, fechando dialog');
          setIsSessionDialogOpen(false);
          setEditingSession(null);
        },
        onError: (error) => {
          console.error('Erro ao salvar sessão:', error);
        }
      }
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      deleteSessionMutation.mutate(
        { id: sessionToDelete, type },
        {
          onSuccess: () => {
            setSessionToDelete(null);
          },
        }
      );
    }
  };

  const handleTogglePublishSession = (sessionId: string, currentStatus: boolean) => {
    togglePublishSessionMutation.mutate({
      id: sessionId,
      is_published: !currentStatus,
      type,
    });
  };

  const getSessionsForDay = (dayId: string) => {
    return sessions?.filter((s) => s.day_id === dayId) || [];
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
          <h1 className="text-3xl font-bold">Gerenciar Programação CIVENI</h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Gerenciar Programação CIVENI
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure dias, sessões e configurações da programação presencial
        </p>
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
              <h2 className="text-xl font-semibold">Dias da Programação</h2>
              <Button onClick={handleCreateDay} variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Dia
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTogglePublishDay(day.id, day.is_published)}
                      >
                        {day.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDay(day)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateSession(day.id)}
                      >
                        + Sessão
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteDay(day.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
              <h2 className="text-xl font-semibold">Sessões</h2>
              <Button onClick={() => handleCreateSession()} variant="secondary">
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
                    <div className="bg-gradient-to-r from-civeni-blue via-civeni-red to-civeni-blue p-4 text-white">
                      <h3 className="font-semibold text-lg text-center">
                        {day.weekday_label} - {formatDate(day.date)}
                      </h3>
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
                                <Badge className={getModalityColor(session.modality)}>
                                  {session.modality}
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
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTogglePublishSession(session.id, session.is_published)}
                              >
                                {session.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditSession(session)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSession(session.id)}
                              >
                                <Trash2 className="w-4 h-4" />
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
              <h2 className="text-xl font-semibold">Palestrantes</h2>
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
            <h2 className="text-xl font-semibold mb-6">Configurações da Página</h2>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Título da Página</label>
                <p className="text-sm text-muted-foreground mb-2">
                  Exibido no cabeçalho da página de programação
                </p>
                <div className="p-3 bg-muted rounded">
                  {settings?.page_title || 'Programação Presencial'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Subtítulo</label>
                <p className="text-sm text-muted-foreground mb-2">
                  Descrição exibida abaixo do título
                </p>
                <div className="p-3 bg-muted rounded">
                  {settings?.page_subtitle || 'Confira toda a programação presencial do III CIVENI 2025'}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">Botão "Baixar Programação"</p>
                  <p className="text-sm text-muted-foreground">
                    Exibir botão para download da programação
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

      {/* Day Dialog */}
      <CiveniDayFormDialog
        isOpen={isDayDialogOpen}
        onClose={() => {
          setIsDayDialogOpen(false);
          setEditingDay(null);
        }}
        onSubmit={handleSaveDay}
        editingDay={editingDay}
        isLoading={dayUpsertMutation.isPending}
        type={type}
      />

      {/* Session Dialog */}
      <CiveniSessionFormDialog
        isOpen={isSessionDialogOpen}
        onClose={() => {
          setIsSessionDialogOpen(false);
          setEditingSession(null);
        }}
        onSubmit={handleSaveSession}
        editingSession={editingSession}
        isLoading={sessionUpsertMutation.isPending}
        type={type}
        days={days || []}
      />

      {/* Delete Day Confirmation */}
      <AlertDialog open={!!dayToDelete} onOpenChange={() => setDayToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este dia? Todas as sessões associadas também serão excluídas.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDay}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Session Confirmation */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CiveniProgramManager;