import SpeakerImagePlaceholder from '@/components/SpeakerImagePlaceholder';
import { Speaker } from '@/contexts/CMSContext';
import { useFixedSpeakerImage } from '@/hooks/useFixedSpeakerImage';
import { RefreshCw } from 'lucide-react';
import React from 'react';

interface SpeakerCardProps {
  speaker: Speaker;
}

const SpeakerCard: React.FC<SpeakerCardProps> = ({ speaker }) => {
  console.log('SpeakerCard rendering for:', speaker.name, 'Image URL:', speaker.image);
  const { imageSrc, isLoading, hasError, retryLoad } = useFixedSpeakerImage(speaker);
  console.log('SpeakerCard state:', { imageSrc: imageSrc?.substring(0, 100) + '...', isLoading, hasError });

  return (
    <div className="group relative bg-gradient-to-br from-white via-white to-gray-50/30 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100/50 backdrop-blur-sm">
      {/* Gradient overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-civeni-blue/5 via-transparent to-civeni-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="aspect-[4/5] overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100">
          {hasError ? (
            <SpeakerImagePlaceholder
              name={speaker.name}
              showError={true}
              onRetry={retryLoad}
              isLoading={isLoading}
            />
          ) : (
            <>
              <img 
                src={imageSrc} 
                alt={speaker.name}
                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                  isLoading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'
                }`}
                loading="lazy"
                style={{ 
                  objectPosition: 'center top',
                  filter: 'contrast(1.1) saturate(1.1)'
                }}
              />
              
              {/* Subtle gradient overlay on image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-civeni-blue border-t-transparent shadow-lg"></div>
                </div>
              )}
              
              {/* Retry button */}
              {hasError && !isLoading && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={retryLoad}
                    className="bg-white/90 text-civeni-blue p-3 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-white/50"
                    title="Tentar carregar imagem novamente"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-poppins leading-tight group-hover:text-civeni-blue transition-colors duration-300">
                {speaker.name}
              </h3>
              <div className="h-1 w-12 bg-gradient-to-r from-civeni-red to-civeni-blue rounded-full mb-4 group-hover:w-20 transition-all duration-500"></div>
            </div>
            
            <h4 className="text-lg font-semibold text-civeni-red mb-2 leading-relaxed">
              {speaker.title}
            </h4>
            
            <p className="text-gray-600 font-medium text-base mb-4 flex items-center">
              <span className="w-2 h-2 bg-civeni-blue rounded-full mr-3 flex-shrink-0"></span>
              {speaker.institution}
            </p>
            
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-300">
              {speaker.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerCard;