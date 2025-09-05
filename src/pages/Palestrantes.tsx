
import { Speaker, useCMS } from '@/contexts/CMSContext';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import Header from '../components/Header';

const Palestrantes = () => {
  const { t } = useTranslation();
  const { content } = useCMS();

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

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
              {t('speakers.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('speakers.description')}
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {content.speakers.map((speaker) => (
              <div
                key={speaker.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={getSpeakerImageSrc(speaker)} 
                    alt={speaker.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.info('Image load failed for speaker:', speaker.name, '- using fallback');
                      // Set fallback image directly
                      const target = e.currentTarget as HTMLImageElement;
                      if (target && target.src !== getDefaultSpeakerImage()) {
                        target.src = getDefaultSpeakerImage();
                      }
                    }}
                    onLoad={() => {
                      console.info('Successfully loaded image for speaker:', speaker.name);
                    }}
                  />
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
            ))}
          </div>
          
          {content.speakers.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">
                Palestrantes serão anunciados em breve.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Palestrantes;
