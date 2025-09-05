
import SpeakerCard from '@/components/SpeakerCard';
import { useCMS } from '@/contexts/CMSContext';
import { clearImageCaches, isProduction } from '@/utils/productionImageUtils';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '../components/Footer';
import Header from '../components/Header';
// Import para debug (remover em produção)
import '../utils/speakerImageDiagnostic';
// Import para diagnóstico de produção
import '../utils/productionDiagnostic';

const Palestrantes = () => {
  const { t } = useTranslation();
  const { content } = useCMS();

  // Limpar cache de imagens em produção
  useEffect(() => {
    if (isProduction()) {
      clearImageCaches();
      console.log('🧹 Cache de imagens limpo para produção');
    }
  }, []);

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
            {content.speakers.map((speaker) => {
              return <SpeakerCard key={speaker.id} speaker={speaker} />;
            })}
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
