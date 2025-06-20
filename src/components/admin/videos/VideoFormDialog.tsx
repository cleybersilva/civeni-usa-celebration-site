
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Youtube, Upload, Save, X } from 'lucide-react';
import { Video } from '@/contexts/CMSContext';

interface VideoFormData {
  title: string;
  description: string;
  videoType: 'youtube' | 'upload';
  youtubeUrl: string;
  uploadedVideoUrl: string;
  thumbnail: string;
  order: number;
}

interface VideoFormDialogProps {
  isOpen: boolean;
  editingVideo: Video | null;
  videoForm: VideoFormData;
  setVideoForm: React.Dispatch<React.SetStateAction<VideoFormData>>;
  onSave: () => void;
  onCancel: () => void;
}

const VideoFormDialog: React.FC<VideoFormDialogProps> = ({
  isOpen,
  editingVideo,
  videoForm,
  setVideoForm,
  onSave,
  onCancel
}) => {
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

  if (!isOpen) return null;

  return (
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
          <label className="block text-sm font-medium mb-2">URL da Thumbnail</label>
          <Input
            value={videoForm.thumbnail}
            onChange={(e) => setVideoForm(prev => ({ ...prev, thumbnail: e.target.value }))}
            placeholder="URL da imagem de capa (opcional)"
          />
          <p className="text-sm text-gray-500 mt-1">
            Para vídeos do YouTube, a thumbnail será preenchida automaticamente
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
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button onClick={onCancel} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoFormDialog;
