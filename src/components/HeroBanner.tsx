import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';


const HeroBanner = () => {
  const { t, i18n } = useTranslation();
  const { content, loading: cmsLoading } = useCMS();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Filtrar apenas slides ativos para exibição pública
  const slides = content.bannerSlides
    .filter(slide => slide.id && slide.id !== 'new') // Filtrar slides válidos
    .sort((a, b) => a.order - b.order);
  
  // Pré-carregar imagens dos banners
  useEffect(() => {
    const preloadImages = async () => {
      if (slides.length === 0) {
        setImagesLoaded(true);
        return;
      }

      console.log('🖼️ Pré-carregando', slides.length, 'imagens de banner...');
      let loaded = 0;
      const total = slides.length;

      await Promise.all(
        slides.map((slide) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.src = slide.bgImage;
            
            img.onload = () => {
              loaded += 1;
              const progress = Math.round((loaded / total) * 100);
              setLoadingProgress(progress);
              console.log(`✅ Imagem ${loaded}/${total} carregada (${progress}%)`);
              resolve();
            };
            
            img.onerror = () => {
              loaded += 1;
              const progress = Math.round((loaded / total) * 100);
              setLoadingProgress(progress);
              console.warn(`⚠️ Erro ao carregar imagem ${loaded}/${total}`);
              resolve();
            };
          });
        })
      );

      console.log('🎉 Todas as imagens foram pré-carregadas!');
      setImagesLoaded(true);
    };

    if (!cmsLoading && slides.length > 0) {
      preloadImages();
    }
  }, [cmsLoading, slides]);

  // Debug: Log completo dos slides
  useEffect(() => {
    console.log('🎯 HeroBanner - Current Language:', i18n.language);
    console.log('🎯 HeroBanner - Total Slides:', slides.length);
    slides.forEach((slide, idx) => {
      console.log(`📋 Slide ${idx}:`, {
        id: slide.id,
        title: slide.title?.substring(0, 30),
        titleEn: slide.titleEn?.substring(0, 30),
        titleEs: slide.titleEs?.substring(0, 30),
        titleTr: slide.titleTr?.substring(0, 30),
        hasTr: !!slide.titleTr
      });
    });
  }, [slides, i18n.language]);

  // Função para obter texto traduzido
  const getTranslatedText = (pt: string, en?: string, es?: string, tr?: string) => {
    const currentLang = i18n.language.split('-')[0]; // Pega apenas 'en', 'es', 'pt', 'tr'
    
    console.log('🌍 getTranslatedText:', {
      currentLang,
      pt: pt?.substring(0, 20),
      en: en?.substring(0, 20),
      es: es?.substring(0, 20),
      tr: tr?.substring(0, 20),
      willReturn: currentLang === 'tr' ? (tr || pt)?.substring(0, 20) : 'other'
    });
    
    // Retorna a tradução se existir e não for string vazia, senão usa português
    if (currentLang === 'en') return en || pt;
    if (currentLang === 'es') return es || pt;
    if (currentLang === 'tr') return tr || pt;
    return pt; // Padrão português
  };

  // Auto-rotate slides
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [slides.length]);


  // Mostrar loading enquanto CMS está carregando ou imagens estão sendo pré-carregadas
  const isLoading = cmsLoading || !imagesLoaded;

  if (isLoading) {
    return (
      <section className="relative h-screen overflow-hidden bg-gradient-to-br from-civeni-blue via-[#731b4c] to-civeni-red">
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="text-center text-white max-w-2xl w-full">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold font-poppins mb-4">
                CIVENI 2025
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                {t('transmission.common.loadingBanners', 'Carregando banners do CIVENI 2025...')}
              </p>
            </div>
            
            {/* Barra de progresso */}
            <div className="w-full max-w-md mx-auto">
              <div className="relative h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-white/90 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse"></div>
                </div>
              </div>
              <p className="text-2xl font-bold mt-4 font-poppins">{loadingProgress}%</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Se não há banners após o loading, mostrar mensagem
  if (slides.length === 0) {
    return (
      <section className="relative h-screen overflow-hidden bg-gradient-to-br from-civeni-blue to-blue-800">
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-5xl md:text-7xl font-bold font-poppins mb-6">
              CIVENI 2025
            </h1>
            <p className="text-xl md:text-2xl mb-4">
              Congresso Internacional Virtual de Enfermagem
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="banner-shell relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`banner-img absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'is-visible opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.bgImage}
            alt={slide.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding={index === 0 ? 'sync' : 'async'}
            fetchPriority={index === 0 ? 'high' : 'low'}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          <div className="relative z-10 flex items-center justify-center h-full px-4">
            <div className="text-center text-white max-w-4xl w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-poppins mb-4 md:mb-6 animate-fade-in leading-tight">
                {getTranslatedText(slide.title, slide.titleEn, slide.titleEs, slide.titleTr)}
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-3 md:mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {getTranslatedText(slide.subtitle, slide.subtitleEn, slide.subtitleEs, slide.subtitleTr)}
              </p>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 md:mb-8 animate-fade-in px-2" style={{ animationDelay: '0.6s' }}>
                {getTranslatedText(slide.description, slide.descriptionEn, slide.descriptionEs, slide.descriptionTr)}
              </p>
              <div className="flex justify-center w-full px-6 sm:px-4">
                <a 
                  href={slide.buttonLink}
                  className="inline-block w-full max-w-[280px] sm:max-w-xs bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-full text-xs sm:text-sm md:text-base lg:text-xl font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 animate-fade-in font-poppins text-center leading-tight"
                  style={{ animationDelay: '0.9s' }}
                >
                  {getTranslatedText(slide.buttonText, slide.buttonTextEn, slide.buttonTextEs, slide.buttonTextTr)}
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-civeni-red scale-125' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
