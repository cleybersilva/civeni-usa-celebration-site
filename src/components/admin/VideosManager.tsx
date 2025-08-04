
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Youtube, Upload, Save, X } from 'lucide-react';
import { useCMS, Video } from '@/contexts/CMSContext';
import { useToast } from '@/hooks/use-toast';
import SimpleImageUpload from './SimpleImageUpload';

const VideosManager = () => {
  const { content, updateVideos } = useCMS();
  const { toast } = useToast();
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoType: 'youtube' as 'youtube' | 'upload',
    youtubeUrl: '',
    uploadedVideoUrl: '',
    thumbnail: '',
    order: 1
  });

  const videos = content.videos.sort((a, b) => a.order - b.order);

  const resetForm = () => {
    setVideoForm({
      title: '',
      description: '',
      videoType: 'youtube',
      youtubeUrl: '',
      uploadedVideoUrl: '',
      thumbnail: '',
      order: Math.max(...videos.map(v => v.order), 0) + 1
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
      videoType: video.videoType,
      youtubeUrl: video.youtubeUrl || '',
      uploadedVideoUrl: video.uploadedVideoUrl || '',
      thumbnail: video.thumbnail,
      order: video.order
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

    const newVideo: Video = {
      id: editingVideo?.id || `video-${Date.now()}`,
      title: videoForm.title,
      description: videoForm.description,
      videoType: videoForm.videoType,
      youtubeUrl: videoForm.videoType === 'youtube' ? videoForm.youtubeUrl : undefined,
      uploadedVideoUrl: videoForm.videoType === 'upload' ? videoForm.uploadedVideoUrl : undefined,
      thumbnail: videoForm.thumbnail || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&h=300&q=80',
      order: videoForm.order
    };

    let updatedVideos;
    if (editingVideo) {
      updatedVideos = videos.map(v => v.id === editingVideo.id ? newVideo : v);
    } else {
      updatedVideos = [...videos, newVideo];
    }

    await updateVideos(updatedVideos);
    setEditingVideo(null);
    setIsCreating(false);
    resetForm();

    toast({
      title: "Sucesso",
      description: editingVideo ? "Vídeo atualizado com sucesso!" : "Vídeo criado com sucesso!"
    });
  };

  const handleDelete = async (videoId: string) => {
    if (confirm('Tem certeza que deseja excluir este vídeo?')) {
      const updatedVideos = videos.filter(v => v.id !== videoId);
      await updateVideos(updatedVideos);
      toast({
        title: "Sucesso",
        description: "Vídeo excluído com sucesso!"
      });
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

            <div>
              <SimpleImageUpload
                value={videoForm.thumbnail}
                onChange={(value) => setVideoForm(prev => ({ ...prev, thumbnail: value }))}
                label="Thumbnail (Miniatura)"
              />
              <p className="text-sm text-gray-500 mt-2">
                📐 <strong>Tamanho recomendado:</strong> 1280 x 720 pixels (proporção 16:9), máximo 2MB
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Para vídeos do YouTube, você pode deixar em branco que a thumbnail será preenchida automaticamente
              </p>
            </div>

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
                      <Badge variant={video.videoType === 'youtube' ? 'destructive' : 'secondary'}>
                        {video.videoType === 'youtube' ? (
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
                      <Badge variant="outline">Ordem: {video.order}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{video.description}</p>
                    <p className="text-xs text-gray-500">
                      {video.videoType === 'youtube' ? video.youtubeUrl : video.uploadedVideoUrl}
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
