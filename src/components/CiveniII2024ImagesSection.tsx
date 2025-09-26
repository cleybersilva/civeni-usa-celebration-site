import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resolveAssetUrl } from '@/utils/assetUrl';

interface CiveniImage {
  id: string;
  url: string;
  alt_text_pt: string;
  alt_text_en: string;
  alt_text_es: string;
  order_index: number;
}

const CiveniII2024ImagesSection = () => {
  const { t, i18n } = useTranslation();
  const [images, setImages] = useState<CiveniImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('civeni_ii_2024_images')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      
      setImages(data || []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAltText = (image: CiveniImage) => {
    switch (i18n.language) {
      case 'en':
        return image.alt_text_en;
      case 'es':
        return image.alt_text_es;
      default:
        return image.alt_text_pt;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [images.length]);

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-civeni-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}...</p>
          </div>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section id="civeni-2024-images" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {t('civeni2024Images.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('civeni2024Images.description')}
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Carrossel Principal */}
          <div className="relative overflow-hidden rounded-lg shadow-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {images.map((image, index) => (
                <div key={image.id} className="w-full flex-shrink-0">
                  <div className="relative">
                    <img
                      src={resolveAssetUrl(image.url)}
                      alt={getAltText(image)}
                      className="w-full h-64 md:h-96 lg:h-[500px] object-contain bg-gray-100"
                      loading="lazy"
                      onError={(e) => {
                        console.warn('Failed to load CIVENI image:', image.url);
                        const target = e.currentTarget;
                        
                        // Tentar URLs alternativas mais robustas
                        const fallbackPaths = [
                          image.url.replace(/\.(jpg|jpeg|png|webp)$/i, '.jpg'),
                          image.url.replace(/\.(jpg|jpeg|png|webp)$/i, '.png'),
                          image.url.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp'),
                          '/assets/civeni-placeholder.jpg',
                          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&h=600&q=80'
                        ];
                        
                        let pathIndex = 0;
                        
                        const tryNextPath = () => {
                          if (pathIndex < fallbackPaths.length) {
                            const testImg = new Image();
                            testImg.onload = () => {
                              target.src = resolveAssetUrl(fallbackPaths[pathIndex]);
                            };
                            testImg.onerror = () => {
                              pathIndex++;
                              if (pathIndex < fallbackPaths.length) {
                                setTimeout(tryNextPath, 100);
                              } else {
                                // Criar placeholder visual mais elegante
                                const fallback = document.createElement('div');
                                fallback.className = 'w-full h-64 md:h-96 lg:h-[500px] flex items-center justify-center bg-gradient-to-br from-civeni-blue to-civeni-red text-white';
                                
                                const container = document.createElement('div');
                                container.className = 'text-center p-8';
                                
                                const icon = document.createElement('div');
                                icon.className = 'text-6xl mb-4';
                                icon.textContent = '📸';
                                
                                const title = document.createElement('div');
                                title.className = 'text-xl font-semibold';
                                title.textContent = 'Imagem CIVENI';
                                
                                container.appendChild(icon);
                                container.appendChild(title);
                                fallback.appendChild(container);
                                
                                target.style.display = 'none';
                                target.parentElement?.appendChild(fallback);
                              }
                            };
                            testImg.src = resolveAssetUrl(fallbackPaths[pathIndex]);
                          }
                        };
                        
                        tryNextPath();
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                      <p className="text-white text-lg md:text-xl font-semibold">
                        {getAltText(image)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botões de Navegação */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all duration-300"
              aria-label={t('common.previous')}
            >
              <ChevronLeft size={24} className="text-civeni-blue" />
            </button>

            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all duration-300"
              aria-label={t('common.next')}
            >
              <ChevronRight size={24} className="text-civeni-blue" />
            </button>
          </div>

          {/* Indicadores */}
          <div className="flex justify-center mt-6 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-civeni-blue scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`${t('common.goToImage')} ${index + 1}`}
              />
            ))}
          </div>

          {/* Miniaturas */}
          <div className="hidden md:flex justify-center mt-8 space-x-4 overflow-x-auto pb-4">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentSlide
                    ? 'border-civeni-blue scale-110'
                    : 'border-gray-300 hover:border-civeni-red'
                }`}
              >
                <img
                  src={resolveAssetUrl(image.url)}
                  alt={getAltText(image)}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <a 
            href="#registration"
            className="bg-civeni-red text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 font-poppins"
          >
            {t('civeni2024Images.registerButton')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default CiveniII2024ImagesSection;