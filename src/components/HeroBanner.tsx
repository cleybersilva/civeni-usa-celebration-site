import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';


const HeroBanner = () => {
  const { t, i18n } = useTranslation();
  const { content } = useCMS();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Filtrar apenas slides ativos para exibição pública
  const slides = content.bannerSlides
    .filter(slide => slide.id && slide.id !== 'new') // Filtrar slides válidos
    .sort((a, b) => a.order - b.order);

  // Função para obter texto traduzido
  const getTranslatedText = (pt: string, en?: string, es?: string) => {
    const currentLang = i18n.language.split('-')[0]; // Pega apenas 'en', 'es', 'pt'
    
    if (currentLang === 'en' && en) return en;
    if (currentLang === 'es' && es) return es;
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
            <p className="text-lg md:text-xl mb-8">
              Carregando banner...
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
                {getTranslatedText(slide.title, slide.titleEn, slide.titleEs)}
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-3 md:mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {getTranslatedText(slide.subtitle, slide.subtitleEn, slide.subtitleEs)}
              </p>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 md:mb-8 animate-fade-in px-2" style={{ animationDelay: '0.6s' }}>
                {getTranslatedText(slide.description, slide.descriptionEn, slide.descriptionEs)}
              </p>
              <div className="flex justify-center w-full px-6 sm:px-4">
                <a 
                  href={slide.buttonLink}
                  className="inline-block w-full max-w-[280px] sm:max-w-xs bg-civeni-red text-white px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-full text-xs sm:text-sm md:text-base lg:text-xl font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 animate-fade-in font-poppins text-center leading-tight"
                  style={{ animationDelay: '0.9s' }}
                >
                  {getTranslatedText(slide.buttonText, slide.buttonTextEn, slide.buttonTextEs)}
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
