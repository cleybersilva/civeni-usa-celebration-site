
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const AboutSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const highlights = [
    {
      icon: '📅',
      title: t('about.highlight1Title'),
      description: t('about.highlight1Desc')
    },
    {
      icon: '🎤',
      title: t('about.highlight2Title'),
      description: t('about.highlight2Desc')
    },
    {
      icon: '📺',
      title: t('about.highlight3Title'),
      description: t('about.highlight3Desc')
    },
    {
      icon: '🏆',
      title: t('about.highlight4Title'),
      description: t('about.highlight4Desc')
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-8 font-poppins">
            {t('about.title')}
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-12">
            {t('about.description')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="text-center group cursor-pointer"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100 transform transition-all duration-300 hover:scale-105 hover:border-civeni-blue hover:shadow-2xl">
                <div className="text-5xl mb-6 group-hover:animate-bounce">
                  {highlight.icon}
                </div>
                <h3 className="text-xl font-bold text-civeni-blue mb-4 font-poppins">
                  {highlight.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={() => {
              console.log('Button clicked, navigating to /area-tematica');
              navigate('/area-tematica');
            }}
            className="bg-civeni-blue text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 font-poppins cursor-pointer"
          >
            {t('about.learnMore')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
