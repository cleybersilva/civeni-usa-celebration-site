import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCMS, Video } from '@/contexts/CMSContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Play, ExternalLink, Youtube, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ImageGuide from './ImageGuide';
import SimpleImageUpload from './SimpleImageUpload';

const VideosManager = () => {
  const { content, updateVideos } = useCMS();
  const { user } = useAdminAuth();
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Forçar recarga dos dados em modo admin quando o componente carrega
  useEffect(() => {
    const loadAdminContent = async () => {
      try {
        // Força recarregamento dos vídeos incluindo inativos
        const { data: allVideos } = await supabase
          .from('videos')
          .select('*')
          .order('order_index', { ascending: true });
        
        console.log('Loaded videos for admin:', allVideos);
      } catch (error) {
        console.error('Erro ao carregar dados do admin:', error);
      }
    };
    loadAdminContent();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoType: 'youtube' as 'youtube' | 'upload',
    youtubeUrl: '',
    uploadedVideoUrl: '',
    thumbnail: '',
    uploadedThumbnail: '',
    order: 1
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      videoType: 'youtube',
      youtubeUrl: '',
      uploadedVideoUrl: '',
      thumbnail: '',
      uploadedThumbnail: '',
      order: content.videos.length + 1
    });
    setEditingVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.email) {
      toast.error('Usuário não autenticado. Faça login novamente.');
      return;
    }
    
    try {
      // Use uploaded thumbnail if available, otherwise use URL
      const finalThumbnail = formData.uploadedThumbnail || formData.thumbnail;
      
      console.log('Dados do formulário:', formData);
      console.log('Thumbnail final selecionada:', finalThumbnail);
      
      // Validate required fields
      if (!formData.title || !formData.description) {
        toast.error('Por favor, preencha todos os campos obrigatórios (título e descrição).');
        return;
      }
      
      // Validate video source
      if (formData.videoType === 'youtube' && !formData.youtubeUrl) {
        toast.error('Por favor, forneça a URL do YouTube.');
        return;
      }
      
      if (formData.videoType === 'upload' && !formData.uploadedVideoUrl) {
        toast.error('Por favor, forneça a URL do vídeo carregado.');
        return;
      }
      
      // Validate that at least one thumbnail source is provided
      if (!finalThumbnail) {
        toast.error('Por favor, faça upload de uma thumbnail ou forneça uma URL para a thumbnail.');
        return;
      }
      
      const videos = [...content.videos];
      
      if (editingVideo) {
        const index = videos.findIndex(v => v.id === editingVideo.id);
        if (index !== -1) {
          videos[index] = {
            ...editingVideo,
            title: formData.title,
            description: formData.description,
            videoType: formData.videoType,
            youtubeUrl: formData.youtubeUrl,
            uploadedVideoUrl: formData.uploadedVideoUrl,
            thumbnail: finalThumbnail,
            order: editingVideo.order // Manter ordem original
          };
        }
      } else {
        const newVideo: Video = {
          id: 'new', // Será tratado no contexto CMS para gerar UUID no Supabase
          title: formData.title,
          description: formData.description,
          videoType: formData.videoType,
          youtubeUrl: formData.youtubeUrl,
          uploadedVideoUrl: formData.uploadedVideoUrl,
          thumbnail: finalThumbnail,
          order: formData.order
        };
        videos.push(newVideo);
      }

      await updateVideos(videos);
      setIsDialogOpen(false);
      resetForm();
      
      toast.success('Vídeo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar vídeo:', error);
      toast.error('Erro ao salvar vídeo. Tente novamente.');
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      videoType: video.videoType,
      youtubeUrl: video.youtubeUrl || '',
      uploadedVideoUrl: video.uploadedVideoUrl || '',
      thumbnail: video.thumbnail,
      uploadedThumbnail: '', // Limpar upload quando editar
      order: video.order
    });
    setIsDialogOpen(true);
    
    console.log('Iniciando edição do vídeo:', video);
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
      return;
    }
    
    try {
      const videos = content.videos.filter(v => v.id !== videoId);
      await updateVideos(videos);
      toast.success('Vídeo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast.error('Erro ao excluir vídeo. Tente novamente.');
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getYoutubeThumbnail = (url: string): string => {
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
    if (formData.videoType === 'youtube' && formData.youtubeUrl && !formData.uploadedThumbnail) {
      const thumbnail = getYoutubeThumbnail(formData.youtubeUrl);
      if (thumbnail) {
        setFormData(prev => ({ ...prev, thumbnail }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Vídeos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Novo Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Editar Vídeo' : 'Adicionar Vídeo'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Título</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tipo de Vídeo</label>
                    <Select 
                      value={formData.videoType} 
                      onValueChange={(value: 'youtube' | 'upload') => setFormData({...formData, videoType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="upload">Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.videoType === 'youtube' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">URL do YouTube</label>
                      <Input
                        type="url"
                        value={formData.youtubeUrl}
                        onChange={(e) => {
                          setFormData({...formData, youtubeUrl: e.target.value});
                          if (e.target.value && !formData.uploadedThumbnail) {
                            autoFillYoutubeThumbnail();
                          }
                        }}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  )}
                  {formData.videoType === 'upload' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">URL do Vídeo Carregado</label>
                      <Input
                        type="url"
                        value={formData.uploadedVideoUrl}
                        onChange={(e) => setFormData({...formData, uploadedVideoUrl: e.target.value})}
                        placeholder="URL do vídeo carregado"
                      />
                    </div>
                  )}
                  <div>
                    <SimpleImageUpload
                      label="Thumbnail (Upload)"
                      value={formData.uploadedThumbnail}
                      onChange={(value) => setFormData({...formData, uploadedThumbnail: value, thumbnail: ''})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL da Thumbnail (Opcional se fez upload)</label>
                    <Input
                      type="url"
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                      placeholder="Cole aqui a URL da thumbnail ou faça upload acima"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ordem de Exibição</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                      {editingVideo ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </div>
              
              <div>
                <ImageGuide type="video" title="Thumbnail do Vídeo" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {content.videos.sort((a, b) => a.order - b.order).map((video) => (
          <Card key={video.id} className={`${!video.id || video.id === 'new' ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback para erro de imagem
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&h=300&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Play className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="text-xl font-bold mb-2">{video.title}</h3>
                    <p className="text-sm">{video.description}</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  {video.videoType === 'youtube' ? (
                    <Youtube className="w-6 h-6 text-red-500" />
                  ) : (
                    <Upload className="w-6 h-6 text-blue-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Ordem:</strong> {video.order}</p>
                <p><strong>Tipo:</strong> {video.videoType === 'youtube' ? 'YouTube' : 'Upload'}</p>
                <p><strong>URL:</strong> {video.videoType === 'youtube' ? video.youtubeUrl : video.uploadedVideoUrl}</p>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                {video.videoType === 'youtube' && video.youtubeUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(video.youtubeUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(video)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(video.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {content.videos.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Play className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum vídeo cadastrado. Clique em "Novo Vídeo" para começar.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideosManager;