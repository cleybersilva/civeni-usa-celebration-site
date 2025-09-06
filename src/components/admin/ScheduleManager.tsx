
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Video, Plus, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleSchema, ScheduleFormData } from './schedule/scheduleSchema';
import { useScheduleOperations } from './schedule/useScheduleOperations';
import ScheduleTable from './schedule/ScheduleTable';
import ScheduleFormDialog from './schedule/ScheduleFormDialog';
import { downloadSchedule } from '@/utils/scheduleUtils';

const ScheduleManager = () => {
  const [selectedType, setSelectedType] = useState<'presencial' | 'online'>('presencial');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const {
    useSchedules,
    scheduleUpsertMutation,
    deleteScheduleMutation,
    togglePublishMutation,
  } = useScheduleOperations();

  const { data: schedules, isLoading } = useSchedules(selectedType);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      type: 'presencial',
      is_recorded: false,
      is_published: false,
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSchedule(null);
    form.reset();
  };

  const onSubmit = (data: ScheduleFormData) => {
    scheduleUpsertMutation.mutate(
      { formData: data, editingSchedule },
      {
        onSuccess: () => {
          handleCloseDialog();
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteScheduleMutation.mutate(id);
  };

  const handleTogglePublish = (id: string, isPublished: boolean) => {
    togglePublishMutation.mutate({ id, is_published: isPublished });
  };

  const handleDownloadSchedule = () => {
    const publishedSchedules = schedules?.filter(s => s.is_published) || [];
    downloadSchedule(publishedSchedules, selectedType);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerenciar Programação
          </CardTitle>
          <CardDescription>
            Gerencie a programação presencial e online do evento
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
              <div className="flex gap-2">
                <Button onClick={handleDownloadSchedule} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={() => openCreateDialog(selectedType)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Item
                </Button>
              </div>
            </div>

            <TabsContent value="presencial">
              <ScheduleTable
                schedules={schedules || []}
                isLoading={isLoading}
                type="presencial"
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            </TabsContent>

            <TabsContent value="online">
              <ScheduleTable
                schedules={schedules || []}
                isLoading={isLoading}
                type="online"
                onEdit={openEditDialog}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ScheduleFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        form={form}
        onSubmit={onSubmit}
        editingSchedule={editingSchedule}
        isLoading={scheduleUpsertMutation.isPending}
      />
    </div>
  );
};

export default ScheduleManager;
