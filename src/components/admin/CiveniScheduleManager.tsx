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
import { DraggableSessionCard } from './schedule/DraggableSessionCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getSessionsForDay = (dayId: string) => {
    return sessions?.filter(session => session.day_id === dayId)
      .sort((a, b) => a.order_in_day - b.order_in_day) || [];
  };

  const reorderSessionsMutation = useMutation({
    mutationFn: async ({ sessionIds, dayId }: { sessionIds: string[], dayId: string }) => {
      console.log('Reordenando sessões:', sessionIds);
      
      // Executar todas as atualizações em paralelo
      await Promise.all(
        sessionIds.map(async (id, index) => {
          const { error } = await supabase
            .from('civeni_program_sessions')
            .update({ order_in_day: index })
            .eq('id', id);
          
          if (error) {
            console.error(`Erro ao atualizar sessão ${id}:`, error);
            throw error;
          }
        })
      );
      
      console.log('Todas as sessões foram reordenadas com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['civeni-sessions', selectedType] });
      queryClient.invalidateQueries({ queryKey: ['civeni-program-sessions', selectedType] });
      toast.success('Ordem das sessões atualizada');
    },
    onError: (error) => {
      console.error('Erro ao reordenar sessões:', error);
      toast.error('Erro ao atualizar ordem das sessões');
    },
  });

  const handleDragEnd = (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const daySessions = getSessionsForDay(dayId);
    const oldIndex = daySessions.findIndex(s => s.id === active.id);
    const newIndex = daySessions.findIndex(s => s.id === over.id);

    const reorderedSessions = arrayMove(daySessions, oldIndex, newIndex);
    const sessionIds = reorderedSessions.map(s => s.id);

    reorderSessionsMutation.mutate({ sessionIds, dayId });
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
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="truncate">Gerenciar Programação CIVENI</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Gerencie dias e sessões da programação presencial e online do III CIVENI 2025
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none text-xs sm:text-sm">
                <a 
                  href={selectedType === 'presencial' ? '/programacao-presencial' : '/programacao-online'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Ver no Site</span>
                  <span className="sm:hidden">Site</span>
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as EventType)}>
            <TabsList className="mb-4 w-full grid grid-cols-2 h-auto">
              <TabsTrigger value="presencial" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                Presencial
              </TabsTrigger>
              <TabsTrigger value="online" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                Online
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="space-y-6">
              {/* Dias Section */}
              <div>
                <div className="flex flex-col items-center mb-4 p-4 rounded-lg text-white" style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)' }}>
                  <h3 className="text-lg font-semibold mb-3 text-center text-white">Dias da Programação</h3>
                  <Button onClick={() => {
                    setEditingDay(null);
                    setIsDayDialogOpen(true);
                  }}
                  variant="secondary"
                  className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
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
                      <Card key={day.id} className="p-3 sm:p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary animate-fade-in">
                        <div className="flex flex-col gap-3">
                          <div className="text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-2 mb-2">
                              <h4 className="font-semibold text-sm sm:text-base">{day.weekday_label}</h4>
                              <Badge variant={day.is_published ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                                {day.is_published ? "Publicado" : "Rascunho"}
                              </Badge>
                              <Badge className={`text-[10px] sm:text-xs ${selectedType === 'presencial' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                {selectedType}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                              {formatDate(day.date)}
                            </p>
                            <p className="font-medium text-sm sm:text-base">{day.headline}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{day.theme}</p>
                            {day.location && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">📍 {day.location}</p>
                            )}
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                              {getSessionsForDay(day.id).length} sessões
                            </p>
                          </div>
                          <div className="flex gap-2 justify-center sm:justify-start">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleTogglePublishDay(day.id, day.is_published)}
                            >
                              {day.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
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
                              className="h-8 w-8 p-0"
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
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Sessões</h3>
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
                        <div key={day.id} className="animate-fade-in">
                          <div className="flex flex-col items-center mb-4 p-4 rounded-lg text-white" style={{ background: 'linear-gradient(to right, #021b3a, #731b4c, #c51d3b, #731b4c, #021b3a)' }}>
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="font-semibold text-lg text-center text-white">
                                {day.weekday_label} - {formatDate(day.date)}
                              </h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingDay(day);
                                  setIsDayDialogOpen(true);
                                }}
                                className="hover:scale-110 transition-transform text-white hover:bg-white/20"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setEditingSession(null);
                                setPreselectedDayId(day.id);
                                setIsSessionDialogOpen(true);
                              }}
                              className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Nova Sessão
                            </Button>
                          </div>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleDragEnd(event, day.id)}
                          >
                            <SortableContext
                              items={daySessions.map(s => s.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-3">
                                {daySessions.map((session) => (
                                  <DraggableSessionCard
                                    key={session.id}
                                    session={session}
                                    formatTime={formatTime}
                                    getSessionTypeColor={getSessionTypeColor}
                                    onTogglePublish={handleTogglePublishSession}
                                    onEdit={(session) => {
                                      setEditingSession(session);
                                      setIsSessionDialogOpen(true);
                                    }}
                                    onDelete={(id) => setDeleteConfirm({ type: 'session', id })}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
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
