
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Youtube } from 'lucide-react';
import { Video } from '@/contexts/CMSContext';
import VideoCard from './VideoCard';

interface VideosListProps {
  videos: Video[];
  onEdit: (video: Video) => void;
  onDelete: (videoId: string) => void;
}

const VideosList: React.FC<VideosListProps> = ({ videos, onEdit, onDelete }) => {
  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Youtube className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum vídeo cadastrado. Clique em "Novo Vídeo" para começar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default VideosList;
