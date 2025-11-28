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
import { Plus, Edit, Trash2, Play, ExternalLink, Youtube, Upload, Eye, X, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageGuide from './ImageGuide';
import SimpleImageUpload from './SimpleImageUpload';

const VideosManager = () => {
  const { content, updateVideos } = useCMS();
  const { user } = useAdminAuth();
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);

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
    
    if (!user || !user.email) {
      toast.error('Usuário não autenticado. Faça login novamente.');
      return;
    }
    
    try {
      // Recuperar sessão admin
      const sessionRaw = localStorage.getItem('adminSession');
      let sessionEmail = '' as string;
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
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Usar função segura do Supabase para exclusão
      const { data: deleteResult, error: deleteError } = await supabase.rpc('admin_delete_video', {
        video_id: videoId,
        user_email: sessionEmail,
        session_token: sessionToken,
      });

      if (deleteError) {
        console.error('Erro ao excluir vídeo:', deleteError);
        throw deleteError;
      }

      console.log('Vídeo excluído:', deleteResult);
      
      // Recarregar dados após exclusão
      await updateVideos(content.videos.filter(v => v.id !== videoId));
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

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1&fs=1&cc_load_policy=1&iv_load_policy=3&autoplay=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&rel=0&modestbranding=1&fs=1&cc_load_policy=1&iv_load_policy=3&autoplay=0`;
    }
    return url;
  };

  const handlePreview = (video: Video) => {
    setPreviewVideo(video);
    setIsPreviewMaximized(false);
  };

  const handleOpenVideo = (video: Video) => {
    const url = video.videoType === 'youtube' ? video.youtubeUrl : video.uploadedVideoUrl;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('URL do vídeo não encontrada');
    }
  };

  const closePreview = () => {
    setPreviewVideo(null);
    setIsPreviewMaximized(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-center sm:justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600 w-full sm:w-auto">
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
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-civeni-blue hover:bg-blue-700 w-full sm:w-auto">
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

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {content.videos.sort((a, b) => a.order - b.order).map((video) => (
          <Card key={video.id} className={`${!video.id || video.id === 'new' ? 'opacity-50' : ''} hover:shadow-lg transition-all duration-300`}>
            <div className="relative">
              <div className="relative h-32 rounded-t-lg overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&h=200&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-30" />
                <div className="absolute top-2 left-2">
                  {video.videoType === 'youtube' ? (
                    <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Youtube className="w-3 h-3" />
                      YouTube
                    </div>
                  ) : (
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Upload
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                  #{video.order}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <h3 className="font-semibold text-sm sm:text-lg text-gray-900 line-clamp-2">{video.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">{video.description}</p>
                </div>
                <div className="text-xs text-gray-500">
                  <p className="truncate">
                    <strong>URL:</strong> {video.videoType === 'youtube' ? video.youtubeUrl : video.uploadedVideoUrl}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 pt-2 border-t">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(video)}
                      title="Visualizar"
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenVideo(video)}
                      title="Abrir vídeo"
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(video)}
                      title="Editar"
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(video.id)}
                      title="Excluir"
                      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
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

      {/* Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg overflow-hidden ${isPreviewMaximized ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'}`}>
            <div className="flex justify-between items-center p-4 bg-civeni-blue text-white">
              <div>
                <h3 className="text-lg font-semibold">{previewVideo.title}</h3>
                <p className="text-sm opacity-90">Preview - {previewVideo.videoType === 'youtube' ? 'YouTube' : 'Upload'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                  title={isPreviewMaximized ? 'Minimizar' : 'Maximizar'}
                >
                  <Maximize2 size={20} />
                </button>
                <button
                  onClick={() => handleOpenVideo(previewVideo)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={20} />
                </button>
                <button
                  onClick={closePreview}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                  title="Fechar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className={`${isPreviewMaximized ? 'h-full' : 'aspect-video'}`}>
              {previewVideo.videoType === 'youtube' ? (
                <iframe
                  src={getVideoEmbedUrl(previewVideo.youtubeUrl || '')}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  title={previewVideo.title}
                  onError={(e) => {
                    console.error('Failed to load YouTube video:', previewVideo.youtubeUrl);
                    toast.error('Erro ao carregar vídeo do YouTube');
                  }}
                />
              ) : (
                <video
                  src={previewVideo.uploadedVideoUrl}
                  className="w-full h-full"
                  controls
                  preload="metadata"
                  title={previewVideo.title}
                  onError={(e) => {
                    console.error('Failed to load uploaded video:', previewVideo.uploadedVideoUrl);
                    toast.error('Erro ao carregar vídeo');
                  }}
                />
              )}
            </div>
            <div className="p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-2">{previewVideo.title}</h4>
              <p className="text-sm text-gray-600">{previewVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideosManager;