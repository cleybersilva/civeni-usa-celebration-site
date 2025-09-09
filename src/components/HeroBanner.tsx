import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';
import conferenceEventImage from '@/assets/conference-event.jpg';
import { resolveAssetUrl } from '@/utils/assetUrl';

interface PreloadedSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bgImage: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  src: string;
  preloaded: boolean;
}

const HeroBanner = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [preloadedSlides, setPreloadedSlides] = useState<PreloadedSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtrar apenas slides ativos para exibição pública
  const slides = content.bannerSlides
    .filter(slide => slide.id && slide.id !== 'new') // Filtrar slides válidos
    .sort((a, b) => a.order - b.order);

  // Preload and decode images atomically
  useEffect(() => {
    let mounted = true;
    
    const preloadSlides = async () => {
      if (slides.length === 0) return;
      
      try {
        // Add preload links to head dynamically
        const preloadContainer = document.getElementById('banner-preloads');
        if (preloadContainer) {
          slides.forEach(slide => {
            const timestamp = slide.updatedAt ? new Date(slide.updatedAt).getTime() : Date.now();
            const src = `${resolveAssetUrl(slide.bgImage)}?v=${timestamp}`;
            
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            preloadContainer.appendChild(link);
          });
        }
        
        const prepared = await Promise.all(
          slides.map(async (slide) => {
            // Generate cache-busting URL with updated_at timestamp
            const timestamp = slide.updatedAt ? new Date(slide.updatedAt).getTime() : Date.now();
            const src = `${resolveAssetUrl(slide.bgImage)}?v=${timestamp}`;
            
            // Preload and decode the image
            await new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => reject(new Error(`Failed to load ${src}`));
              img.src = src;
            });
            
            return {
              ...slide,
              src,
              preloaded: true
            };
          })
        );
        
        if (mounted) {
          setPreloadedSlides(prepared);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('Error preloading banner images:', error);
        // Fallback: use original slides without preloading
        if (mounted) {
          const fallbackSlides = slides.map(slide => ({
            ...slide,
            src: `${resolveAssetUrl(slide.bgImage)}?v=${slide.imageVersion || 1}`,
            preloaded: false
          }));
          setPreloadedSlides(fallbackSlides);
          setIsLoading(false);
        }
      }
    };
    
    preloadSlides();
    return () => { 
      mounted = false; 
      // Cleanup preload links on unmount
      const preloadContainer = document.getElementById('banner-preloads');
      if (preloadContainer) {
        preloadContainer.innerHTML = '';
      }
    };
  }, [slides]);

  useEffect(() => {
    if (preloadedSlides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % preloadedSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [preloadedSlides.length]);

  // Show skeleton while preloading
  if (isLoading || preloadedSlides.length === 0) {
    return (
      <section className="relative h-screen overflow-hidden bg-gradient-to-br from-civeni-blue to-blue-800">
        <div className="absolute inset-0 animate-pulse">
          <div className="h-full w-full bg-gradient-to-br from-gray-300 to-gray-400" />
        </div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white max-w-4xl px-4">
            <div className="h-16 bg-white/20 rounded-lg mb-6 animate-pulse" />
            <div className="h-8 bg-white/20 rounded-lg mb-4 animate-pulse" />
            <div className="h-6 bg-white/20 rounded-lg mb-8 animate-pulse" />
            <div className="h-12 w-48 bg-white/20 rounded-full mx-auto animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="banner-shell relative h-screen overflow-hidden">
      {preloadedSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`banner-img absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? 'is-visible opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${slide.src})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat'
            }}
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
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {preloadedSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-civeni-red scale-125' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
