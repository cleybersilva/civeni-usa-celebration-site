
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';

const RegistrationSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();

  const registrationTiers = content.registrationTiers.sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section id="registration" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block bg-civeni-red text-white px-6 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse">
            {t('registration.urgent')}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {t('registration.title')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('registration.description')}
          </p>
          {content.batchInfo && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-yellow-800 font-semibold">
                {content.batchInfo}
              </p>
            </div>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {registrationTiers.map((tier, index) => (
            <div
              key={tier.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transform transition-all duration-300 hover:scale-105 ${
                tier.recommended 
                  ? 'border-civeni-red shadow-2xl' 
                  : 'border-gray-200 hover:border-civeni-blue'
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-civeni-red text-white px-6 py-2 rounded-full text-sm font-bold">
                    {t('registration.mostPopular')}
                  </div>
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-xl font-bold text-civeni-blue text-center mb-6 font-poppins">
                  {tier.title || tier.name}
                </h3>
                
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-civeni-red mb-2 font-poppins">
                    {tier.price}
                  </div>
                  <div className="text-gray-500">per person</div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-4 rounded-full font-semibold text-lg transition-all duration-300 font-poppins ${
                  tier.recommended
                    ? 'bg-civeni-red text-white hover:bg-red-700 transform hover:scale-105'
                    : 'bg-civeni-green text-white hover:bg-green-600'
                }`}>
                  {t('registration.registerButton')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegistrationSection;
