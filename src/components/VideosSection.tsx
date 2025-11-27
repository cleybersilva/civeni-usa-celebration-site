
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Youtube, Maximize2, ExternalLink, X } from 'lucide-react';
import { useCMS } from '@/contexts/CMSContext';
import { resolveAssetUrl } from '@/utils/assetUrl';

const VideosSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const videos = content.videos.sort((a, b) => a.order - b.order);

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
            {t('videos.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('videos.description')}
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
                  src={resolveAssetUrl(video.thumbnail)} 
                  alt={video.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    console.warn('Failed to load video thumbnail:', video.thumbnail);
                    const target = e.currentTarget;
                    
                    // Tentar URLs alternativas mais robustas
                    const fallbackPaths = [
                      video.thumbnail.replace(/\.(jpg|jpeg|png|webp)$/i, '.jpg'),
                      video.thumbnail.replace(/\.(jpg|jpeg|png|webp)$/i, '.png'),
                      video.thumbnail.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp'),
                      '/assets/default-video-thumbnail.jpg',
                      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&h=300&q=80'
                    ];
                    
                    let pathIndex = 0;
                    
                    const tryNextPath = () => {
                      if (pathIndex < fallbackPaths.length) {
                        const testImg = new Image();
                        testImg.onload = () => {
                          target.src = resolveAssetUrl(fallbackPaths[pathIndex]);
                        };
                        testImg.onerror = () => {
                          pathIndex++;
                          if (pathIndex < fallbackPaths.length) {
                            setTimeout(tryNextPath, 100);
                          } else {
                            // Último recurso: placeholder SVG melhorado
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMTMzM0ZGIi8+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTUwIDEwMFYyMDBMMjUwIDE1MEwxNTAgMTAwWiIgZmlsbD0iI0ZGRkZGRiIvPgo8dGV4dCB4PSIyMDAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5WaWRlbyBUaHVtYm5haWw8L3RleHQ+Cjwvc3ZnPgo=';
                          }
                        };
                        testImg.src = resolveAssetUrl(fallbackPaths[pathIndex]);
                      }
                    };
                    
                    tryNextPath();
                  }}
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
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    title={selectedVideo.title}
                    onError={(e) => {
                      console.error('Failed to load YouTube video:', selectedVideo.youtubeUrl);
                    }}
                  />
                ) : (
                  <video
                    src={selectedVideo.uploadedVideoUrl}
                    className="w-full h-full"
                    controls
                    preload="metadata"
                    title={selectedVideo.title}
                    onError={(e) => {
                      console.error('Failed to load uploaded video:', selectedVideo.uploadedVideoUrl);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <a 
            href="/inscricoes"
            className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-8 py-4 rounded-full text-xl font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 font-poppins"
          >
            {t('videos.registerButton')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideosSection;
