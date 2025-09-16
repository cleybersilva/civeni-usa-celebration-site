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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
      <div className="aspect-[3/4] overflow-hidden relative bg-gradient-to-br from-civeni-blue/10 to-civeni-red/10">
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
              className={`w-full h-full object-contain transition-all duration-300 ${
                isLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
              loading="lazy"
              style={{ objectPosition: 'center top' }}
            />
            
            {/* Indicador de carregamento */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civeni-blue"></div>
              </div>
            )}
            
            {/* Botão de retry para erros */}
            {hasError && !isLoading && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={retryLoad}
                  className="bg-civeni-blue text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  title="Tentar carregar imagem novamente"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-civeni-blue mb-2 font-poppins">
          {speaker.name}
        </h3>
        <h4 className="text-lg font-semibold text-civeni-red mb-3">
          {speaker.title}
        </h4>
        <p className="text-gray-600 mb-3 font-medium">
          {speaker.institution}
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">
          {speaker.bio}
        </p>
      </div>
    </div>
  );
};

export default SpeakerCard;