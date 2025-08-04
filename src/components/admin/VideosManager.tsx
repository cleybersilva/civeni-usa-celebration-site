
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Youtube, Upload, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ThumbnailUpload from './ThumbnailUpload';

interface Video {
  id: string;
  title: string;
  description: string;
  video_type: 'youtube' | 'upload';
  youtube_url?: string;
  uploaded_video_url?: string;
  thumbnail: string;
  order_index: number;
  is_active: boolean;
}

const VideosManager = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<Video[]>([]);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoType: 'youtube' as 'youtube' | 'upload',
    youtubeUrl: '',
    uploadedVideoUrl: '',
    thumbnail: '',
    order: 1
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      
      // Converter os dados para o tipo correto
      const videosData: Video[] = (data || []).map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        video_type: video.video_type as 'youtube' | 'upload',
        youtube_url: video.youtube_url,
        uploaded_video_url: video.uploaded_video_url,
        thumbnail: video.thumbnail,
        order_index: video.order_index,
        is_active: video.is_active
      }));
      
      setVideos(videosData);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vídeos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setVideoForm({
      title: '',
      description: '',
      videoType: 'youtube',
      youtubeUrl: '',
      uploadedVideoUrl: '',
      thumbnail: '',
      order: Math.max(...videos.map(v => v.order_index), 0) + 1
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingVideo(null);
    resetForm();
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setIsCreating(false);
    setVideoForm({
      title: video.title,
      description: video.description,
      videoType: video.video_type,
      youtubeUrl: video.youtube_url || '',
      uploadedVideoUrl: video.uploaded_video_url || '',
      thumbnail: video.thumbnail,
      order: video.order_index
    });
  };

  const handleSave = async () => {
    if (!videoForm.title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (videoForm.videoType === 'youtube' && !videoForm.youtubeUrl.trim()) {
      toast({
        title: "Erro",
        description: "URL do YouTube é obrigatória para vídeos do YouTube",
        variant: "destructive"
      });
      return;
    }

    if (videoForm.videoType === 'upload' && !videoForm.uploadedVideoUrl.trim()) {
      toast({
        title: "Erro",
        description: "URL do vídeo é obrigatória para vídeos enviados",
        variant: "destructive"
      });
      return;
    }

    if (!videoForm.thumbnail.trim()) {
      toast({
        title: "Erro",
        description: "Thumbnail é obrigatória",
        variant: "destructive"
      });
      return;
    }

    try {
      const videoData = {
        title: videoForm.title,
        description: videoForm.description,
        video_type: videoForm.videoType,
        youtube_url: videoForm.videoType === 'youtube' ? videoForm.youtubeUrl : null,
        uploaded_video_url: videoForm.videoType === 'upload' ? videoForm.uploadedVideoUrl : null,
        thumbnail: videoForm.thumbnail,
        order_index: videoForm.order,
        is_active: true
      };

      if (editingVideo) {
        // Atualizar vídeo existente
        const { error } = await supabase
          .from('videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Vídeo atualizado com sucesso!"
        });
      } else {
        // Criar novo vídeo
        const { error } = await supabase
          .from('videos')
          .insert(videoData);

        if (error) throw error;
        toast({
          title: "Sucesso", 
          description: "Vídeo criado com sucesso!"
        });
      }

      setEditingVideo(null);
      setIsCreating(false);
      resetForm();
      await fetchVideos();
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar vídeo",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (videoId: string) => {
    if (confirm('Tem certeza que deseja excluir este vídeo?')) {
      try {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', videoId);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Vídeo excluído com sucesso!"
        });
        await fetchVideos();
      } catch (error) {
        console.error('Erro ao excluir vídeo:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir vídeo",
          variant: "destructive"
        });
      }
    }
  };

  const handleCancel = () => {
    setEditingVideo(null);
    setIsCreating(false);
    resetForm();
  };

  const getYoutubeThumbnail = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return '';
  };

  const autoFillYoutubeThumbnail = () => {
    if (videoForm.videoType === 'youtube' && videoForm.youtubeUrl && !videoForm.thumbnail) {
      const thumbnail = getYoutubeThumbnail(videoForm.youtubeUrl);
      if (thumbnail) {
        setVideoForm(prev => ({ ...prev, thumbnail }));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-civeni-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Vídeos</h2>
        <Button onClick={handleCreate} className="bg-civeni-blue hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Vídeo
        </Button>
      </div>

      {(isCreating || editingVideo) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingVideo ? 'Editar Vídeo' : 'Novo Vídeo'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <Input
                value={videoForm.title}
                onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do vídeo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Textarea
                value={videoForm.description}
                onChange={(e) => setVideoForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do vídeo"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Vídeo</label>
              <Tabs 
                value={videoForm.videoType} 
                onValueChange={(value) => setVideoForm(prev => ({ ...prev, videoType: value as 'youtube' | 'upload' }))}
              >
                <TabsList>
                  <TabsTrigger value="youtube">
                    <Youtube className="w-4 h-4 mr-2" />
                    YouTube
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="youtube" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">URL do YouTube *</label>
                    <Input
                      value={videoForm.youtubeUrl}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                      onBlur={autoFillYoutubeThumbnail}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">URL do Vídeo *</label>
                    <Input
                      value={videoForm.uploadedVideoUrl}
                      onChange={(e) => setVideoForm(prev => ({ ...prev, uploadedVideoUrl: e.target.value }))}
                      placeholder="URL do vídeo enviado"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Cole aqui a URL do vídeo após fazer o upload para um serviço de hospedagem
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <ThumbnailUpload
              value={videoForm.thumbnail}
              onChange={(value) => setVideoForm(prev => ({ ...prev, thumbnail: value }))}
              label="Upload da Thumbnail"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Ordem</label>
              <Input
                type="number"
                value={videoForm.order}
                onChange={(e) => setVideoForm(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={handleCancel} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex space-x-4 flex-1">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-civeni-blue">{video.title}</h3>
                      <Badge variant={video.video_type === 'youtube' ? 'destructive' : 'secondary'}>
                        {video.video_type === 'youtube' ? (
                          <>
                            <Youtube className="w-3 h-3 mr-1" />
                            YouTube
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">Ordem: {video.order_index}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{video.description}</p>
                    <p className="text-xs text-gray-500">
                      {video.video_type === 'youtube' ? video.youtube_url : video.uploaded_video_url}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEdit(video)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(video.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {videos.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Youtube className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum vídeo cadastrado. Clique em "Novo Vídeo" para começar.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideosManager;
