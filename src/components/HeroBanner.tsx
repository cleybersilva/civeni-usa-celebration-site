import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';
import conferenceEventImage from '@/assets/conference-event.jpg';
import { resolveAssetUrl } from '@/utils/assetUrl';

const HeroBanner = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = content.bannerSlides.sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (slides.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${resolveAssetUrl(slide.bgImage)})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat'
            }}
            onError={(e) => {
              console.warn('Failed to load banner image:', slide.bgImage);
              (e.currentTarget as HTMLDivElement).style.backgroundImage = 'linear-gradient(135deg, #0D3B66 0%, #1E88E5 100%)';
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
    </section>
  );
};

export default HeroBanner;
