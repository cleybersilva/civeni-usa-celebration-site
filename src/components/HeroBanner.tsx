import conferenceImage from '@/assets/conference-event.jpg';
import { useCMS } from '@/contexts/CMSContext';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const HeroBanner = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Filtrar apenas slides ativos para exibição pública
  const slides = content.bannerSlides
    .filter(slide => slide.id && slide.id !== 'new') // Filtrar slides válidos
    .sort((a, b) => a.order - b.order)
    .map(slide => ({
      ...slide,
      bgImage: getValidImageUrl(slide.bgImage, slide.id)
    }));

  // Função para obter URL válida da imagem com fallback
  function getValidImageUrl(originalUrl: string, slideId: string): string {
    // Se houve erro anterior com esta imagem, usar fallback
    if (imageErrors[slideId]) {
      return conferenceImage;
    }
    
    // Corrigir URLs conhecidas problemáticas
    if (originalUrl?.includes('src/assets/')) {
      return conferenceImage;
    }
    
    // Se a URL está no formato /assets/, corrigir para absoluto
    if (originalUrl?.startsWith('/assets/')) {
      return conferenceImage; // Use local asset como fallback
    }
    
    // Retornar URL original se parece válida
    return originalUrl || conferenceImage;
  }
  
  // Lidar com erros de carregamento de imagem
  const handleImageError = (slideId: string) => {
    setImageErrors(prev => ({ ...prev, [slideId]: true }));
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
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${conferenceImage})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-5xl md:text-7xl font-bold font-poppins mb-6">
              III CIVENI 2025
            </h1>
            <p className="text-xl md:text-2xl mb-4">
              Congresso Internacional Multidisciplinar
            </p>
            <p className="text-lg md:text-xl mb-8">
              Celebration, Florida • 8-10 Dezembro 2025
            </p>
            <a 
              href="/inscricoes"
              className="bg-civeni-red text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 font-poppins"
            >
              Inscreva-se Agora
            </a>
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
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${slide.bgImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat'
            }}
          />
          {/* Adicionar img element para detectar erros */}
          <img
            src={slide.bgImage}
            alt=""
            style={{ display: 'none' }}
            onError={() => handleImageError(slide.id)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-50" />
          
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="text-center text-white max-w-4xl px-4">
              <h1 className="text-5xl md:text-7xl font-bold font-poppins mb-6 animate-fade-in">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl mb-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                {slide.subtitle}
              </p>
              <p className="text-lg md:text-xl mb-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                {slide.description}
              </p>
              <a 
                href={slide.buttonLink}
                className="bg-civeni-red text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 animate-fade-in font-poppins"
                style={{ animationDelay: '0.9s' }}
              >
                {slide.buttonText}
              </a>
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
