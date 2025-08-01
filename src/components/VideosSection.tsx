
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Youtube, Maximize2, ExternalLink, X } from 'lucide-react';
import { useCMS } from '@/contexts/CMSContext';

const VideosSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const videos = content.videos.sort((a, b) => a.order - b.order);

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleVideoClick = (video: any) => {
    setSelectedVideo(video);
    setIsMaximized(false);
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleOpenYoutube = () => {
    if (selectedVideo?.videoType === 'youtube' && selectedVideo?.youtubeUrl) {
      window.open(selectedVideo.youtubeUrl, '_blank');
    } else if (selectedVideo?.videoType === 'upload' && selectedVideo?.uploadedVideoUrl) {
      window.open(selectedVideo.uploadedVideoUrl, '_blank');
    }
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setIsMaximized(false);
  };

  if (videos.length === 0) {
    return null;
  }

  return (
    <section id="videos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {content.siteTexts.videosTitle}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {content.siteTexts.videosDescription}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <div 
              key={video.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => handleVideoClick(video)}
            >
              <div className="relative">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="text-center text-white">
                    {video.videoType === 'youtube' ? (
                      <Youtube size={48} className="mx-auto mb-2 text-red-500" />
                    ) : (
                      <Play size={48} className="mx-auto mb-2" />
                    )}
                    <p className="text-sm font-medium">{t('videos.watchVideo')}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-civeni-blue mb-3 font-poppins">
                  {video.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg overflow-hidden ${isMaximized ? 'w-full h-full' : 'max-w-4xl w-full max-h-[90vh]'}`}>
              <div className="flex justify-between items-center p-4 bg-civeni-blue text-white">
                <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleMaximize}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                    title={isMaximized ? t('videos.minimize') : t('videos.maximize')}
                  >
                    <Maximize2 size={20} />
                  </button>
                  <button
                    onClick={handleOpenYoutube}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                    title={t('videos.openYoutube')}
                  >
                    <ExternalLink size={20} />
                  </button>
                  <button
                    onClick={closeVideo}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
                    title={t('videos.close')}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className={`${isMaximized ? 'h-full' : 'aspect-video'}`}>
                {selectedVideo.videoType === 'youtube' ? (
                  <iframe
                    src={getVideoEmbedUrl(selectedVideo.youtubeUrl)}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title={selectedVideo.title}
                  />
                ) : (
                  <video
                    src={selectedVideo.uploadedVideoUrl}
                    className="w-full h-full"
                    controls
                    title={selectedVideo.title}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <a 
            href="#registration"
            className="bg-civeni-red text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 font-poppins"
          >
            {t('videos.registerButton')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideosSection;
