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
import { toast } from 'sonner';
import { Plus, Trash2, Save, Youtube } from 'lucide-react';

interface Stream {
  id?: string;
  title: Record<string, string>;
  description: Record<string, string>;
  youtube_video_id: string;
  youtube_channel_handle: string;
  is_live: boolean;
  scheduled_date: string;
  order_index: number;
  is_active: boolean;
}

const TransmissionStreamsManager = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Stream>({
    title: { pt: '', en: '', es: '', tr: '' },
    description: { pt: '', en: '', es: '', tr: '' },
    youtube_video_id: '',
    youtube_channel_handle: '@CiveniUSA2025',
    is_live: false,
    scheduled_date: '',
    order_index: 1,
    is_active: true
  });

  const { data: streams, isLoading } = useQuery({
    queryKey: ['admin-transmission-streams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmission_streams')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (stream: Stream) => {
      if (stream.id) {
        const { error } = await supabase
          .from('transmission_streams')
          .update(stream)
          .eq('id', stream.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transmission_streams')
          .insert([stream]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transmission-streams'] });
      toast.success('Stream salvo com sucesso!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transmission_streams')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transmission-streams'] });
      toast.success('Stream removido!');
    }
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: { pt: '', en: '', es: '', tr: '' },
      description: { pt: '', en: '', es: '', tr: '' },
      youtube_video_id: '',
      youtube_channel_handle: '@CiveniUSA2025',
      is_live: false,
      scheduled_date: '',
      order_index: 1,
      is_active: true
    });
  };

  const handleEdit = (stream: any) => {
    setEditingId(stream.id);
    setFormData(stream);
  };

  const handleSave = () => {
    if (!formData.title.pt || !formData.youtube_video_id) {
      toast.error('Preencha título (PT) e ID do vídeo do YouTube');
      return;
    }
    saveMutation.mutate(editingId ? { ...formData, id: editingId } : formData);
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Gerenciar Transmissões (Streams)</h2>
        <Button onClick={resetForm} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Nova Stream
        </Button>
      </div>

      {/* Form */}
      <Card className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {(['pt', 'en', 'es', 'tr'] as const).map((lang) => (
            <div key={lang} className="space-y-2">
              <Label>Título ({lang.toUpperCase()})</Label>
              <Input
                value={formData.title[lang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: { ...formData.title, [lang]: e.target.value }
                  })
                }
                placeholder={`Título em ${lang.toUpperCase()}`}
              />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(['pt', 'en', 'es', 'tr'] as const).map((lang) => (
            <div key={lang} className="space-y-2">
              <Label>Descrição ({lang.toUpperCase()})</Label>
              <Textarea
                value={formData.description[lang]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: { ...formData.description, [lang]: e.target.value }
                  })
                }
                placeholder={`Descrição em ${lang.toUpperCase()}`}
                rows={3}
              />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>ID do Vídeo YouTube</Label>
            <Input
              value={formData.youtube_video_id}
              onChange={(e) => setFormData({ ...formData, youtube_video_id: e.target.value })}
              placeholder="dQw4w9WgXcQ"
            />
          </div>

          <div className="space-y-2">
            <Label>Canal do YouTube</Label>
            <Input
              value={formData.youtube_channel_handle}
              onChange={(e) => setFormData({ ...formData, youtube_channel_handle: e.target.value })}
              placeholder="@CiveniUSA2025"
            />
          </div>

          <div className="space-y-2">
            <Label>Data Agendada</Label>
            <Input
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.is_live}
              onCheckedChange={(checked) => setFormData({ ...formData, is_live: checked })}
            />
            <Label>🔴 Ao Vivo</Label>
          </div>

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
              className="w-20"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            {editingId ? 'Atualizar' : 'Criar'}
          </Button>
          {editingId && (
            <Button onClick={resetForm} variant="outline">
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      {/* List */}
      <div className="grid gap-4">
        {streams?.map((stream) => {
          const title = stream.title as unknown as Record<string, string>;
          const description = stream.description as unknown as Record<string, string>;
          
          return (
            <Card key={stream.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{title.pt}</h3>
                    {stream.is_live && (
                      <Badge className="bg-red-600">🔴 AO VIVO</Badge>
                    )}
                    {!stream.is_active && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{description.pt}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Youtube className="w-3 h-3" />
                      {stream.youtube_video_id}
                    </span>
                    {stream.scheduled_date && (
                      <span>
                        {new Date(stream.scheduled_date).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(stream)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir?')) {
                        deleteMutation.mutate(stream.id);
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

export default TransmissionStreamsManager;
