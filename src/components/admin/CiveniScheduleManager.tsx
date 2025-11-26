import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Video, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { 
  useCiveniScheduleOperations, 
  CiveniDay, 
  CiveniSession,
  EventType 
} from './schedule/useCiveniScheduleOperations';
import CiveniDayFormDialog from './schedule/CiveniDayFormDialog';
import CiveniSessionFormDialog from './schedule/CiveniSessionFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CiveniScheduleManager = () => {
  const [selectedType, setSelectedType] = useState<EventType>('presencial');
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<CiveniDay | null>(null);
  const [editingSession, setEditingSession] = useState<CiveniSession | null>(null);
  const [preselectedDayId, setPreselectedDayId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'day' | 'session', id: string } | null>(null);

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

  const { data: days, isLoading: daysLoading } = useDays(selectedType);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(selectedType);

  const getSessionsForDay = (dayId: string) => {
    return sessions?.filter(session => session.day_id === dayId) || [];
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

  const handleDaySubmit = (data: any) => {
    console.log('handleDaySubmit chamado com:', data);
    console.log('editingDay:', editingDay);
    console.log('selectedType:', selectedType);
    
    dayUpsertMutation.mutate(
      { formData: data, editingDay, type: selectedType },
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

  const handleSessionSubmit = (data: any) => {
    console.log('handleSessionSubmit chamado com:', data);
    console.log('editingSession:', editingSession);
    console.log('selectedType:', selectedType);
    
    sessionUpsertMutation.mutate(
      { formData: data, editingSession, type: selectedType },
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

  const handleDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'day') {
      deleteDayMutation.mutate({ id: deleteConfirm.id, type: selectedType });
    } else {
      deleteSessionMutation.mutate({ id: deleteConfirm.id, type: selectedType });
    }
    setDeleteConfirm(null);
  };

  const handleTogglePublishDay = (id: string, isPublished: boolean) => {
    togglePublishDayMutation.mutate({ id, is_published: !isPublished, type: selectedType });
  };

  const handleTogglePublishSession = (id: string, isPublished: boolean) => {
    togglePublishSessionMutation.mutate({ id, is_published: !isPublished, type: selectedType });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gerenciar Programação CIVENI
              </CardTitle>
              <CardDescription>
                Gerencie dias e sessões da programação presencial e online do III CIVENI 2025
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={selectedType === 'presencial' ? '/programacao-presencial' : '/programacao-online'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver no Site
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as EventType)}>
            <TabsList className="mb-4">
              <TabsTrigger value="presencial" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Presencial
              </TabsTrigger>
              <TabsTrigger value="online" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Online
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="space-y-6">
              {/* Dias Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Dias da Programação</h3>
                  <Button onClick={() => {
                    setEditingDay(null);
                    setIsDayDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Dia
                  </Button>
                </div>

                {daysLoading ? (
                  <div className="text-center py-8">Carregando dias...</div>
                ) : !days || days.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum dia configurado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {days.map((day) => (
                      <Card key={day.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{day.weekday_label}</h4>
                              <Badge variant={day.is_published ? "default" : "secondary"}>
                                {day.is_published ? "Publicado" : "Rascunho"}
                              </Badge>
                              <Badge className={selectedType === 'presencial' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}>
                                {selectedType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {formatDate(day.date)}
                            </p>
                            <p className="font-medium">{day.headline}</p>
                            <p className="text-sm text-muted-foreground">{day.theme}</p>
                            {day.location && (
                              <p className="text-xs text-muted-foreground mt-1">📍 {day.location}</p>
                            )}
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
                              {day.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingSession(null);
                                setPreselectedDayId(day.id);
                                setIsSessionDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Nova Sessão
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingDay(day);
                                setIsDayDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirm({ type: 'day', id: day.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Sessões Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Sessões</h3>
                  <Button 
                    onClick={() => {
                      setEditingSession(null);
                      setPreselectedDayId(null);
                      setIsSessionDialogOpen(true);
                    }}
                    disabled={!days || days.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Sessão
                  </Button>
                </div>

                {sessionsLoading ? (
                  <div className="text-center py-8">Carregando sessões...</div>
                ) : !sessions || sessions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma sessão configurada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {days?.map((day) => {
                      const daySessions = getSessionsForDay(day.id);
                      if (!daySessions.length) return null;

                      return (
                        <div key={day.id}>
                          <h4 className="font-semibold text-base mb-3">
                            {day.weekday_label} - {formatDate(day.date)}
                          </h4>
                          <div className="space-y-2 ml-4">
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
                                    <h5 className="font-medium mb-1">{session.title}</h5>
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
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleTogglePublishSession(session.id, session.is_published)}
                                    >
                                      {session.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingSession(session);
                                        setIsSessionDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeleteConfirm({ type: 'session', id: session.id })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CiveniDayFormDialog
        isOpen={isDayDialogOpen}
        onClose={() => {
          setIsDayDialogOpen(false);
          setEditingDay(null);
        }}
        onSubmit={handleDaySubmit}
        editingDay={editingDay}
        isLoading={dayUpsertMutation.isPending}
        type={selectedType}
      />

      <CiveniSessionFormDialog
        isOpen={isSessionDialogOpen}
        onClose={() => {
          setIsSessionDialogOpen(false);
          setEditingSession(null);
          setPreselectedDayId(null);
        }}
        onSubmit={handleSessionSubmit}
        editingSession={editingSession}
        preselectedDayId={preselectedDayId}
        isLoading={sessionUpsertMutation.isPending}
        type={selectedType}
        days={days || []}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'day' 
                ? 'Tem certeza que deseja excluir este dia? Todas as sessões deste dia também serão excluídas.'
                : 'Tem certeza que deseja excluir esta sessão?'
              }
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CiveniScheduleManager;
