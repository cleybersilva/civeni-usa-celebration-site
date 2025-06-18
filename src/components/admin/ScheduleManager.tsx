
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar, Clock, MapPin, Video, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const scheduleSchema = z.object({
  type: z.enum(['presencial', 'online']),
  date: z.string().min(1, 'Data é obrigatória'),
  start_time: z.string().min(1, 'Horário de início é obrigatório'),
  end_time: z.string().min(1, 'Horário de fim é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  speaker_name: z.string().optional(),
  speaker_photo_url: z.string().optional(),
  category: z.enum(['palestra', 'workshop', 'painel', 'intervalo', 'credenciamento']),
  location: z.string().optional(),
  virtual_link: z.string().optional(),
  platform: z.string().optional(),
  is_recorded: z.boolean().default(false),
  recording_url: z.string().optional(),
  is_published: z.boolean().default(false),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

const ScheduleManager = () => {
  const [selectedType, setSelectedType] = useState<'presencial' | 'online'>('presencial');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      type: 'presencial',
      is_recorded: false,
      is_published: false,
    },
  });

  // Fetch schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', selectedType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('type', selectedType)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Create/Update schedule mutation
  const scheduleUpsertMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      if (editingSchedule) {
        const { error } = await supabase
          .from('schedules')
          .update(data)
          .eq('id', editingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      form.reset();
      toast({
        title: editingSchedule ? 'Cronograma atualizado' : 'Cronograma criado',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o cronograma.',
        variant: 'destructive',
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: 'Cronograma excluído',
        description: 'O item foi removido com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o cronograma.',
        variant: 'destructive',
      });
    },
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('schedules')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });

  const openEditDialog = (schedule: any) => {
    setEditingSchedule(schedule);
    form.reset({
      ...schedule,
      date: schedule.date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = (type: 'presencial' | 'online') => {
    setEditingSchedule(null);
    form.reset({
      type,
      is_recorded: false,
      is_published: false,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: ScheduleFormData) => {
    scheduleUpsertMutation.mutate(data);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      palestra: 'bg-blue-100 text-blue-800',
      workshop: 'bg-green-100 text-green-800',
      painel: 'bg-purple-100 text-purple-800',
      intervalo: 'bg-gray-100 text-gray-800',
      credenciamento: 'bg-yellow-100 text-yellow-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerenciar Cronogramas
          </CardTitle>
          <CardDescription>
            Gerencie os cronogramas presencial e online do evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as 'presencial' | 'online')}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="presencial" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Presencial
                </TabsTrigger>
                <TabsTrigger value="online" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Online
                </TabsTrigger>
              </TabsList>
              <Button onClick={() => openCreateDialog(selectedType)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Item
              </Button>
            </div>

            <TabsContent value="presencial">
              <div className="space-y-4">
                {isLoading ? (
                  <div>Carregando...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules?.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{new Date(schedule.date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</TableCell>
                          <TableCell className="font-medium">{schedule.title}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(schedule.category)}`}>
                              {schedule.category}
                            </span>
                          </TableCell>
                          <TableCell>{schedule.location || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePublishMutation.mutate({ id: schedule.id, is_published: !schedule.is_published })}
                              className={schedule.is_published ? 'text-green-600' : 'text-gray-400'}
                            >
                              {schedule.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(schedule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>

            <TabsContent value="online">
              <div className="space-y-4">
                {isLoading ? (
                  <div>Carregando...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules?.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{new Date(schedule.date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</TableCell>
                          <TableCell className="font-medium">{schedule.title}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(schedule.category)}`}>
                              {schedule.category}
                            </span>
                          </TableCell>
                          <TableCell>{schedule.platform || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePublishMutation.mutate({ id: schedule.id, is_published: !schedule.is_published })}
                              className={schedule.is_published ? 'text-green-600' : 'text-gray-400'}
                            >
                              {schedule.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(schedule)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={() => {
        setIsDialogOpen(false);
        setEditingSchedule(null);
        form.reset();
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Editar Cronograma' : 'Novo Cronograma'}
            </DialogTitle>
            <DialogDescription>
              {editingSchedule ? 'Edite as informações do cronograma' : 'Adicione um novo item ao cronograma'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="presencial">Presencial</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="palestra">Palestra</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="painel">Painel</SelectItem>
                          <SelectItem value="intervalo">Intervalo</SelectItem>
                          <SelectItem value="credenciamento">Credenciamento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da atividade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição da atividade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="speaker_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Palestrante</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do palestrante" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speaker_photo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto do Palestrante (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="URL da foto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.watch('type') === 'presencial' ? (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Local do evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plataforma</FormLabel>
                        <FormControl>
                          <Input placeholder="Zoom, YouTube, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="virtual_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Virtual</FormLabel>
                        <FormControl>
                          <Input placeholder="Link da transmissão" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {form.watch('type') === 'online' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="is_recorded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Será Gravado</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('is_recorded') && (
                    <FormField
                      control={form.control}
                      name="recording_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Gravação</FormLabel>
                          <FormControl>
                            <Input placeholder="Link da gravação" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Publicado</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Marque para exibir no site público
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={scheduleUpsertMutation.isPending}>
                  {scheduleUpsertMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManager;
