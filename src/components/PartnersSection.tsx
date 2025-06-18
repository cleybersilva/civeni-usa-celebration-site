
import React from 'react';
import { useTranslation } from 'react-i18next';

const PartnersSection = () => {
  const { t } = useTranslation();
  
  const organizers = [
    { name: "VCCU", logo: "🎓" },
    { name: "Hope & Justice", logo: "⚖️" }
  ];

  const partners = [
    { name: "Harvard University", logo: "🏛️" },
    { name: "Stanford University", logo: "🌟" },
    { name: "MIT", logo: "🔬" },
    { name: "Oxford University", logo: "📚" },
    { name: "University of São Paulo", logo: "🇧🇷" },
    { name: "Universidad de Barcelona", logo: "🇪🇸" }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {t('partners.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('partners.description')}
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-civeni-red text-center mb-8 font-poppins">
              {t('partners.organizedBy')}
            </h3>
            <div className="flex justify-center items-center space-x-12">
              {organizers.map((org, index) => (
                <div
                  key={index}
                  className="text-center group cursor-pointer transform transition-all duration-300 hover:scale-110"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-8 w-40 h-40 flex flex-col items-center justify-center group-hover:shadow-2xl group-hover:bg-civeni-blue transition-all duration-300">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {org.logo}
                    </div>
                    <h4 className="font-bold text-civeni-blue group-hover:text-white transition-colors duration-300">
                      {org.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-civeni-red text-center mb-8 font-poppins">
              {t('partners.academicPartners')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {partners.map((partner, index) => (
                <div
                  key={index}
                  className="text-center group cursor-pointer transform transition-all duration-300 hover:scale-105"
                >
                  <div className="bg-white rounded-xl shadow-md p-6 h-32 flex flex-col items-center justify-center group-hover:shadow-xl group-hover:bg-gray-50 transition-all duration-300">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {partner.logo}
                    </div>
                    <h4 className="text-xs font-semibold text-gray-700 text-center leading-tight">
                      {partner.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-civeni-blue text-white rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 font-poppins">
              {t('partners.becomePartner')}
            </h3>
            <p className="text-lg opacity-90 mb-6">
              {t('partners.partnerDesc')}
            </p>
            <button className="bg-civeni-red text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors font-poppins">
              {t('partners.partnerButton')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
