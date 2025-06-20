
import { useState } from 'react';
import { Video } from '@/contexts/CMSContext';
import { useToast } from '@/hooks/use-toast';

interface VideoFormData {
  title: string;
  description: string;
  videoType: 'youtube' | 'upload';
  youtubeUrl: string;
  uploadedVideoUrl: string;
  thumbnail: string;
  order: number;
}

export const useVideoForm = (videos: Video[], updateVideos: (videos: Video[]) => Promise<void>) => {
  const { toast } = useToast();
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [videoForm, setVideoForm] = useState<VideoFormData>({
    title: '',
    description: '',
    videoType: 'youtube',
    youtubeUrl: '',
    uploadedVideoUrl: '',
    thumbnail: '',
    order: 1
  });

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

  const getYoutubeId = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1].split('&')[0];
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1];
    }
    return '';
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
      order: videoForm.order,
      youtubeId: videoForm.videoType === 'youtube' ? getYoutubeId(videoForm.youtubeUrl) : ''
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

  return {
    editingVideo,
    isCreating,
    videoForm,
    setVideoForm,
    handleCreate,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel
  };
};
