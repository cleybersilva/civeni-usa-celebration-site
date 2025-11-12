import SpeakerImagePlaceholder from '@/components/SpeakerImagePlaceholder';
import { Speaker } from '@/contexts/CMSContext';
import { useFixedSpeakerImage } from '@/hooks/useFixedSpeakerImage';
import { RefreshCw } from 'lucide-react';
import React from 'react';

interface SpeakerCardProps {
  speaker: Speaker;
}

const SpeakerCard: React.FC<SpeakerCardProps> = ({ speaker }) => {
  const { imageSrc, isLoading, hasError, retryLoad } = useFixedSpeakerImage(speaker);

  return (
    <div className="group relative bg-gradient-to-br from-white via-white to-gray-50/30 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100/50 backdrop-blur-sm">
      {/* Gradient overlay for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-civeni-blue/5 via-transparent to-civeni-red/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex justify-center items-center py-6 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-40 h-40 rounded-full overflow-hidden relative bg-white shadow-lg">
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
                  className={`w-full h-full object-contain transition-all duration-700 group-hover:scale-105 ${
                    isLoading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'
                  }`}
                  loading="lazy"
                  style={{ 
                    objectPosition: 'center center',
                    filter: 'contrast(1.1) saturate(1.1)'
                  }}
                />
              
                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-civeni-blue border-t-transparent shadow-lg"></div>
                  </div>
                )}
                
                {/* Retry button */}
                {hasError && !isLoading && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={retryLoad}
                      className="bg-white/90 text-civeni-blue p-2 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 backdrop-blur-sm border border-white/50"
                      title="Tentar carregar imagem novamente"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="p-5">
          <div className="space-y-2.5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 font-poppins leading-tight group-hover:text-civeni-blue transition-colors duration-300">
                {speaker.name}
              </h3>
              <div className="h-0.5 w-10 bg-gradient-to-r from-civeni-red to-civeni-blue rounded-full mb-2.5 group-hover:w-16 transition-all duration-500"></div>
            </div>
            
            <h4 className="text-sm font-semibold text-civeni-red mb-1 leading-relaxed">
              {speaker.title}
            </h4>
            
            <p className="text-gray-600 font-medium text-xs mb-2 flex items-center">
              <span className="w-1.5 h-1.5 bg-civeni-blue rounded-full mr-2 flex-shrink-0"></span>
              {speaker.institution}
            </p>
            
            <p className="text-gray-700 text-xs leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-300">
              {speaker.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakerCard;