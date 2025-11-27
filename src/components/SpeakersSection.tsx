
import SpeakerImagePlaceholder from '@/components/SpeakerImagePlaceholder';
import { useCMS } from '@/contexts/CMSContext';
import { useFixedSpeakerImage } from '@/hooks/useFixedSpeakerImage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const SpeakersSection = () => {
  const { t } = useTranslation();
  const { content, loading } = useCMS();
  const navigate = useNavigate();
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  
  // Usar exatamente os mesmos speakers da página /palestrantes
  const speakers = [...content.speakers]
    .filter(speaker => speaker.id && speaker.id !== 'new')
    .sort((a, b) => a.order - b.order);
  
  console.log('🎤 SpeakersSection: Rendering with', speakers.length, 'speakers');
  console.log('📋 First 3 speakers:', speakers.slice(0, 3).map(s => ({ name: s.name, id: s.id })));

  // Componente para a imagem do speaker atual
  const CurrentSpeakerImage = () => {
    const speaker = speakers[currentSpeaker];
    const { imageSrc, isLoading, hasError, retryLoad } = useFixedSpeakerImage(speaker);
    
    return (
      <div className="relative w-full h-64 md:h-full" style={{ background: 'linear-gradient(90deg, #0A2A43 0%, #C8105A 100%)' }}>
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
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              style={{ objectPosition: 'center top' }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civeni-blue"></div>
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

  if (loading || speakers.length === 0) {
    return (
      <section className="py-20 bg-civeni-blue">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="text-white mt-4 text-xl">Carregando palestrantes...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-civeni-blue">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 font-poppins">
            {t('speakers.title')}
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-white opacity-90 max-w-3xl mx-auto">
            {t('speakers.description')}
          </p>
        </div>
        
          <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
            <div className="md:flex">
              <div 
                className="md:w-1/3 cursor-pointer" 
                onClick={() => navigate('/palestrantes')}
              >
                <CurrentSpeakerImage />
              </div>
              <div className="md:w-2/3 p-5 md:p-6 lg:p-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-civeni-blue mb-2 font-poppins">
                  {speakers[currentSpeaker].name}
                </h3>
                <p className="text-base sm:text-lg md:text-xl text-civeni-red mb-2 font-semibold">
                  {speakers[currentSpeaker].title}
                </p>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 md:mb-6">
                  {speakers[currentSpeaker].institution}
                </p>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-6 md:mb-8">
                  {speakers[currentSpeaker].bio}
                </p>
                
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {speakers.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSpeaker(index)}
                        className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
                          index === currentSpeaker ? 'bg-civeni-red' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center gap-3 md:gap-4">
                    <button
                      onClick={prevSpeaker}
                      className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-4 py-2 md:px-6 rounded-full text-sm md:text-base hover:opacity-90 transition-colors font-poppins"
                    >
                      {t('speakers.previous')}
                    </button>
                    <button
                      onClick={nextSpeaker}
                      className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-4 py-2 md:px-6 rounded-full text-sm md:text-base hover:opacity-90 transition-colors font-poppins"
                    >
                      {t('speakers.next')}
                    </button>
                  </div>
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
