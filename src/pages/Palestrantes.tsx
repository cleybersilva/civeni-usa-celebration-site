
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { resolveAssetUrl } from '@/utils/assetUrl';

const Palestrantes = () => {
  const { t } = useTranslation();
  const { content } = useCMS();

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
                    src={resolveAssetUrl(speaker.image)} 
                    alt={speaker.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.warn('Failed to load speaker image:', speaker.image);
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE2MCIgcj0iNjAiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwMCAzMDBDMTAwIDI1MCA1MCAyMDAgMjAwIDIwMFMzMDAgMjUwIDMwMCAzMDBIMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
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
