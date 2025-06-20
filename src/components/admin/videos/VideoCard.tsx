
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Youtube, Upload } from 'lucide-react';
import { Video } from '@/contexts/CMSContext';

interface VideoCardProps {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onEdit, onDelete }) => {
  return (
    <Card>
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
              onClick={() => onEdit(video)}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onDelete(video.id)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;
