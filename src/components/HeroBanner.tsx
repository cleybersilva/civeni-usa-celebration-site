
import React, { useState, useEffect } from 'react';

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "III International Multidisciplinary Congress",
      subtitle: "Join us for three days of innovation and discovery",
      description: "December 8-10, 2025 • Celebration, Florida",
      bgImage: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=2000&q=80"
    },
    {
      title: "World-Class Speakers",
      subtitle: "Learn from international experts in various fields",
      description: "Keynote presentations and panel discussions",
      bgImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2000&q=80"
    },
    {
      title: "Submit Your Research",
      subtitle: "Share your work with the global community",
      description: "Oral presentations and poster sessions available",
      bgImage: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=2000&q=80"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.bgImage})` }}
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
              <button 
                className="bg-civeni-red text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 animate-fade-in font-poppins"
                style={{ animationDelay: '0.9s' }}
              >
                Register Here
              </button>
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
