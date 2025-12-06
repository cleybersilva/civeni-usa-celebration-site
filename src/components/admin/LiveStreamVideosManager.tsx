import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Youtube } from 'lucide-react';

interface LiveStreamVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const extractYouTubeId = (value: string): string | null => {
  const trimmed = value.trim();
  // Se já for um ID puro
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]{11}).*/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
};

const normalizeYoutubeValue = (value: string): string => {
  const id = extractYouTubeId(value);
  if (!id) {
    throw new Error('Link do YouTube inválido. Verifique o endereço informado.');
  }
  return id;
};

const LiveStreamVideosManager: React.FC = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<LiveStreamVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<LiveStreamVideo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    order_index: 1,
    is_published: true,
  });

  const getAdminSession = (): { sessionEmail: string; sessionToken: string } | null => {
    const sessionRaw = localStorage.getItem('adminSession');
    let sessionEmail = '';
    let sessionToken: string | undefined;

    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        sessionEmail = parsed?.user?.email || '';
        sessionToken = parsed?.session_token || parsed?.sessionToken;
      } catch (e) {
        console.warn('Falha ao ler a sessão admin do localStorage');
      }
    }

    if (!sessionEmail || !sessionToken) {
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão administrativa é inválida ou expirou. Faça login novamente.',
        variant: 'destructive',
      });
      return null;
    }

    return { sessionEmail, sessionToken };
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('live_stream_videos')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar vídeos de transmissão ao vivo:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao carregar vídeos de transmissão ao vivo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtube_url: '',
      order_index: (videos?.length || 0) + 1,
      is_published: true,
    });
    setEditingVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: 'Validação',
        description: 'O título do vídeo é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.youtube_url.trim()) {
      toast({
        title: 'Validação',
        description: 'O link do YouTube é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    let normalizedYoutubeValue: string;
    try {
      normalizedYoutubeValue = normalizeYoutubeValue(formData.youtube_url);
    } catch (err: any) {
      toast({
        title: 'Validação',
        description: err?.message || 'Link do YouTube inválido.',
        variant: 'destructive',
      });
      return;
    }

    const orderIndex = Number(formData.order_index) || 0;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      youtube_url: normalizedYoutubeValue,
      order_index: orderIndex,
      is_published: formData.is_published,
    };

    try {
      const adminSession = getAdminSession();
      if (!adminSession) {
        return;
      }

      const { sessionEmail, sessionToken } = adminSession;

      if (editingVideo) {
        const { error } = await (supabase as any).rpc('admin_upsert_live_stream_video', {
          video_data: {
            id: editingVideo.id,
            ...payload,
          },
          user_email: sessionEmail,
          session_token: sessionToken,
        });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Vídeo atualizado com sucesso.',
        });
      } else {
        const { error } = await (supabase as any).rpc('admin_upsert_live_stream_video', {
          video_data: payload,
          user_email: sessionEmail,
          session_token: sessionToken,
        });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Vídeo criado com sucesso.',
        });
      }

      setDialogOpen(false);
      resetForm();
      loadVideos();
    } catch (error: any) {
      console.error('Erro ao salvar vídeo de transmissão ao vivo:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao salvar vídeo.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (video: LiveStreamVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      youtube_url: video.youtube_url,
      order_index: video.order_index,
      is_published: video.is_published,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (video: LiveStreamVideo) => {
    if (!window.confirm('Tem certeza que deseja excluir este vídeo?')) return;

    try {
      const adminSession = getAdminSession();
      if (!adminSession) {
        return;
      }

      const { sessionEmail, sessionToken } = adminSession;

      const { data, error } = await (supabase as any).rpc('admin_delete_live_stream_video', {
        video_id: video.id,
        user_email: sessionEmail,
        session_token: sessionToken,
      });

      if (error) throw error;

      console.log('Vídeo de transmissão ao vivo excluído:', data);

      toast({
        title: 'Sucesso',
        description: 'Vídeo excluído com sucesso.',
      });

      loadVideos();
    } catch (error: any) {
      console.error('Erro ao excluir vídeo de transmissão ao vivo:', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao excluir vídeo.',
        variant: 'destructive',
      });
    }
  };

  const formatYoutubeDisplay = (value: string) => {
    if (!value) return '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
      return `https://youtu.be/${value}`;
    }
    return value;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gerenciar Transmissão Ao Vivo</h2>
          <p className="text-sm text-muted-foreground">
            Cadastre os vídeos que serão exibidos na aba "Ao Vivo" da página pública.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Título do vídeo</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="youtube_url">Link do YouTube</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) =>
                    setFormData({ ...formData, youtube_url: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=XXXXX ou https://youtu.be/XXXXX"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <Label htmlFor="order_index">Ordem de exibição</Label>
                  <Input
                    id="order_index"
                    type="number"
                    min={1}
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order_index: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                  />
                  <Label htmlFor="is_published">Publicado?</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVideo ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vídeos cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando vídeos...</p>
          ) : videos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum vídeo cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Link do YouTube</TableHead>
                    <TableHead className="w-24">Ordem</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {video.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-red-500" />
                          <span className="truncate">
                            {formatYoutubeDisplay(video.youtube_url)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{video.order_index}</TableCell>
                      <TableCell>
                        <Badge
                          variant={video.is_published ? 'default' : 'secondary'}
                        >
                          {video.is_published ? 'Publicado' : 'Desativado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleEdit(video)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleDelete(video)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveStreamVideosManager;
