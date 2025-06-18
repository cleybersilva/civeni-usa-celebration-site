
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Youtube } from 'lucide-react';
import { useCMS } from '@/contexts/CMSContext';

const VideosSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  
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
    if (video.videoType === 'youtube' && video.youtubeUrl) {
      window.open(video.youtubeUrl, '_blank');
    } else if (video.videoType === 'upload' && video.uploadedVideoUrl) {
      window.open(video.uploadedVideoUrl, '_blank');
    }
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
                    <p className="text-sm font-medium">Assistir Vídeo</p>
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

        <div className="text-center mt-12">
          <a 
            href="#registration"
            className="bg-civeni-red text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 font-poppins"
          >
            Inscreva-se no III Civeni 2025
          </a>
        </div>
      </div>
    </section>
  );
};

export default VideosSection;
