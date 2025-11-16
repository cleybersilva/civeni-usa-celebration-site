
import SpeakerImagePlaceholder from '@/components/SpeakerImagePlaceholder';
import { useCMS } from '@/contexts/CMSContext';
import { useFixedSpeakerImage } from '@/hooks/useFixedSpeakerImage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const SpeakersSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const navigate = useNavigate();
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  
  const speakers = content.speakers.sort((a, b) => a.order - b.order);

  // Componente para a imagem do speaker atual
  const CurrentSpeakerImage = () => {
    const { imageSrc, isLoading, hasError, retryLoad } = useFixedSpeakerImage(speakers[currentSpeaker]);
    
    return (
      <div className="relative w-full h-64 md:h-full bg-gradient-to-br from-civeni-blue/10 to-civeni-red/10">
        {hasError ? (
          <SpeakerImagePlaceholder
            name={speakers[currentSpeaker].name}
            showError={true}
            onRetry={retryLoad}
            isLoading={isLoading}
          />
        ) : (
          <>
            <img
              src={imageSrc}
              alt={speakers[currentSpeaker].name}
              className={`w-full h-full object-contain transition-all duration-300 ${
                isLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
              style={{ objectPosition: 'center top' }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const nextSpeaker = () => {
    setCurrentSpeaker((prev) => (prev + 1) % speakers.length);
  };

  const prevSpeaker = () => {
    setCurrentSpeaker((prev) => (prev - 1 + speakers.length) % speakers.length);
  };

  if (speakers.length === 0) {
    return <div>Loading speakers...</div>;
  }

  return (
    <section className="py-20 bg-civeni-blue">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-poppins">
            {t('speakers.title')}
          </h2>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            {t('speakers.description')}
          </p>
        </div>
        
          <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              <div 
                className="md:w-1/3 cursor-pointer" 
                onClick={() => navigate('/palestrantes')}
              >
                <CurrentSpeakerImage />
              </div>
              <div className="md:w-2/3 p-8">
                <h3 className="text-3xl font-bold text-civeni-blue mb-2 font-poppins">
                  {speakers[currentSpeaker].name}
                </h3>
                <p className="text-xl text-civeni-red mb-2 font-semibold">
                  {speakers[currentSpeaker].title}
                </p>
                <p className="text-lg text-gray-600 mb-6">
                  {speakers[currentSpeaker].institution}
                </p>
                <p className="text-gray-700 leading-relaxed mb-8">
                  {speakers[currentSpeaker].bio}
                </p>
                
                <div className="flex justify-between items-center gap-4">
                  <button
                    onClick={prevSpeaker}
                    className="bg-civeni-blue text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-poppins flex-shrink-0"
                  >
                    {t('speakers.previous')}
                  </button>
                  <div className="flex space-x-2 justify-center flex-1">
                    {speakers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSpeaker(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSpeaker ? 'bg-civeni-red' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={nextSpeaker}
                    className="bg-civeni-blue text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-poppins flex-shrink-0"
                  >
                    {t('speakers.next')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpeakersSection;
