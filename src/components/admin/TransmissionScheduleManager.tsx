import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Calendar } from 'lucide-react';

interface ScheduleItem {
  id?: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string | null;
  topic: Record<string, string>;
  speaker: string | null;
  modality: 'online' | 'presencial' | 'hibrido';
  meet_room_link: string | null;
  stream_id: string | null;
  order_index: number;
  is_active: boolean;
}

const TransmissionScheduleManager = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ScheduleItem>({
    day: 1,
    date: '',
    start_time: '',
    end_time: null,
    topic: { pt: '', en: '', es: '', tr: '' },
    speaker: null,
    modality: 'online',
    meet_room_link: null,
    stream_id: null,
    order_index: 1,
    is_active: true
  });

  const { data: scheduleItems, isLoading } = useQuery({
    queryKey: ['admin-transmission-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmission_schedule')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (item: ScheduleItem) => {
      if (item.id) {
        const { error } = await supabase
          .from('transmission_schedule')
          .update(item)
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transmission_schedule')
          .insert([item]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transmission-schedule'] });
      toast.success('Item salvo com sucesso!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transmission_schedule')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transmission-schedule'] });
      toast.success('Item removido!');
    }
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      day: 1,
      date: '',
      start_time: '',
      end_time: null,
      topic: { pt: '', en: '', es: '', tr: '' },
      speaker: null,
      modality: 'online',
      meet_room_link: null,
      stream_id: null,
      order_index: 1,
      is_active: true
    });
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
  };

  const handleSave = () => {
    if (!formData.topic.pt || !formData.date || !formData.start_time) {
      toast.error('Preencha tópico (PT), data e hora de início');
      return;
    }
    saveMutation.mutate(editingId ? { ...formData, id: editingId } : formData);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Gerenciar Programação da Transmissão</h2>
        <Button onClick={resetForm} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Novo Item
        </Button>
      </div>

      {/* Form */}
      <Card className="p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Dia do Evento</Label>
            <Select
              value={formData.day.toString()}
              onValueChange={(value) => setFormData({ ...formData, day: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Dia 1 - 11/12</SelectItem>
                <SelectItem value="2">Dia 2 - 12/12</SelectItem>
                <SelectItem value="3">Dia 3 - 13/12</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Modalidade</Label>
            <Select
              value={formData.modality}
              onValueChange={(value: 'online' | 'presencial' | 'hibrido') =>
                setFormData({ ...formData, modality: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hora Início</Label>
            <Input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Hora Fim (opcional)</Label>
            <Input
              type="time"
              value={formData.end_time || ''}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value || null })}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(['pt', 'en', 'es', 'tr'] as const).map((lang) => (
            <div key={lang} className="space-y-2">
              <Label>Tópico ({lang.toUpperCase()})</Label>
              <Textarea
                value={formData.topic[lang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    topic: { ...formData.topic, [lang]: e.target.value }
                  })
                }
                placeholder={`Tópico em ${lang.toUpperCase()}`}
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Palestrante (opcional)</Label>
            <Input
              value={formData.speaker || ''}
              onChange={(e) => setFormData({ ...formData, speaker: e.target.value || null })}
              placeholder="Nome do palestrante"
            />
          </div>

          <div className="space-y-2">
            <Label>Link da Sala (Google Meet)</Label>
            <Input
              value={formData.meet_room_link || ''}
              onChange={(e) => setFormData({ ...formData, meet_room_link: e.target.value || null })}
              placeholder="https://meet.google.com/xxx-yyyy-zzz"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Ativo</Label>
          </div>

          <div className="space-y-2">
            <Label>Ordem</Label>
            <Input
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 1 })}
              className="w-full sm:w-20"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleSave} className="gap-2 w-full sm:w-auto">
            <Save className="w-4 h-4" />
            {editingId ? 'Atualizar' : 'Criar'}
          </Button>
          {editingId && (
            <Button onClick={resetForm} variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      <div className="grid gap-4">
        {scheduleItems?.map((item) => {
          const topic = item.topic as unknown as Record<string, string>;
          
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{item.modality.toUpperCase()}</Badge>
                    <Badge variant="outline">Dia {item.day}</Badge>
                    {!item.is_active && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  <h3 className="font-semibold mb-1">{topic.pt}</h3>
                  {item.speaker && (
                    <p className="text-sm text-gray-600 mb-1">👤 {item.speaker}</p>
                  )}
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span>🕐 {item.start_time} {item.end_time && `- ${item.end_time}`}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir?')) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TransmissionScheduleManager;
