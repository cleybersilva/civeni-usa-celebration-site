
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCMS } from '@/contexts/CMSContext';
import VideoFormDialog from './videos/VideoFormDialog';
import VideosList from './videos/VideosList';
import { useVideoForm } from './videos/hooks/useVideoForm';

const VideosManager = () => {
  const { content, updateVideos } = useCMS();
  const videos = content.videos.sort((a, b) => a.order - b.order);

  const {
    editingVideo,
    isCreating,
    videoForm,
    setVideoForm,
    handleCreate,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel
  } = useVideoForm(videos, updateVideos);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Vídeos</h2>
        <Button onClick={handleCreate} className="bg-civeni-blue hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Vídeo
        </Button>
      </div>

      <VideoFormDialog
        isOpen={isCreating || editingVideo !== null}
        editingVideo={editingVideo}
        videoForm={videoForm}
        setVideoForm={setVideoForm}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <VideosList
        videos={videos}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default VideosManager;
