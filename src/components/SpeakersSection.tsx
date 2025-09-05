
import { Speaker, useCMS } from '@/contexts/CMSContext';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SpeakersSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  
  const speakers = content.speakers.sort((a, b) => a.order - b.order);

  // Função para obter imagem padrão de palestrante
  const getDefaultSpeakerImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZ0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZjNmNGY2Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZTVlN2ViIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjYmdHcmFkaWVudCkiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNDAiIHI9IjUwIiBmaWxsPSIjOWNhM2FmIi8+PHBhdGggZD0ibTEwMCAzMjBjMC00NCA0MC04MCA5MC04MGgxMjBjNTAgMCA5MCAzNiA5MCA4MHYyMGgtMzAweiIgZmlsbD0iIzljYTNhZiIvPjx0ZXh0IHg9IjIwMCIgeT0iMzYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiPkltYWdlbSBOw6NvIERpc3BvbsOtdmVsPC90ZXh0Pjwvc3ZnPg==';
  };

  // Função para obter URL segura da imagem do palestrante
  const getSpeakerImageSrc = (speaker: Speaker): string => {
    if (!speaker.image) {
      console.info('No image provided for speaker:', speaker.name, '- using default');
      return getDefaultSpeakerImage();
    }

    // Se for uma imagem base64, verificar se não é muito grande
    if (speaker.image.startsWith('data:')) {
      // Se a string base64 for muito grande (>50KB), usar imagem padrão
      if (speaker.image.length > 50000) {
        console.info('Speaker image too large (>50KB), using default for:', speaker.name);
        return getDefaultSpeakerImage();
      }
      return speaker.image;
    }

    try {
      // Para URLs normais, usar resolveAssetUrl com versioning
      const version = speaker.photoVersion || Date.now();
      const resolvedUrl = resolveAssetUrl(speaker.image);
      return `${resolvedUrl}?v=${version}`;
    } catch (error) {
      console.warn('Error resolving speaker image URL for:', speaker.name, error);
      return getDefaultSpeakerImage();
    }
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
              <div className="md:w-1/3">
                <img
                  src={getSpeakerImageSrc(speakers[currentSpeaker])}
                  alt={speakers[currentSpeaker].name}
                  className="w-full h-64 md:h-full object-cover"
                  onError={(e) => {
                    console.info('Image load failed for speaker:', speakers[currentSpeaker].name, '- using fallback');
                    // Set fallback image directly
                    const target = e.currentTarget as HTMLImageElement;
                    if (target && target.src !== getDefaultSpeakerImage()) {
                      target.src = getDefaultSpeakerImage();
                    }
                  }}
                  onLoad={() => {
                    console.info('Successfully loaded image for speaker:', speakers[currentSpeaker].name);
                  }}
                />
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
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={prevSpeaker}
                    className="bg-civeni-blue text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-poppins"
                  >
                    {t('speakers.previous')}
                  </button>
                  <div className="flex space-x-2">
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
                    className="bg-civeni-blue text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors font-poppins"
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
