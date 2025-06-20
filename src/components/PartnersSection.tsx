import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';

const PartnersSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();
  
  // Filter partners by type
  const organizers = content.partners.filter(p => p.type === 'organizer');
  const academicPartners = content.partners.filter(p => p.type === 'academic');
  const sponsors = content.partners.filter(p => p.type === 'sponsor');

  // Add VCCU as main organizer with the new logo
  const mainOrganizer = {
    name: 'VCCU',
    logo: '/lovable-uploads/d7a1c7d2-c77d-46ae-b1d0-a882c59b41fd.png',
    type: 'organizer'
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {content.siteTexts.partnersTitle}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {content.siteTexts.partnersDescription}
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {/* Main Organizer - VCCU */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-civeni-red text-center mb-8 font-poppins">
              {t('partners.organizedBy')}
            </h3>
            <div className="flex justify-center items-center">
              <div className="text-center group cursor-pointer transform transition-all duration-300 hover:scale-110">
                <div className="bg-white rounded-2xl shadow-lg p-8 w-64 h-40 flex flex-col items-center justify-center group-hover:shadow-2xl group-hover:bg-civeni-blue transition-all duration-300">
                  <img 
                    src={mainOrganizer.logo} 
                    alt={mainOrganizer.name}
                    className="max-w-full max-h-20 object-contain mb-4"
                  />
                  <h4 className="font-bold text-civeni-blue group-hover:text-white transition-colors duration-300 text-sm">
                    Veni Creator Christian University
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Other Organizers */}
          {organizers.length > 0 && (
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-civeni-red text-center mb-8 font-poppins">
                {t('partners.organizedBy')} - {t('partners.organizedBy')}
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
          )}
          
          {academicPartners.length > 0 && (
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-civeni-red text-center mb-8 font-poppins">
                {t('partners.academicPartners')}
              </h3>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl">
                  {academicPartners.map((partner, index) => (
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
          )}

          {sponsors.length > 0 && (
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-civeni-red text-center mb-8 font-poppins">
                {t('partners.sponsors')}
              </h3>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl">
                  {sponsors.map((sponsor, index) => (
                    <div
                      key={index}
                      className="text-center group cursor-pointer transform transition-all duration-300 hover:scale-105"
                    >
                      <div className="bg-white rounded-xl shadow-md p-6 h-32 flex flex-col items-center justify-center group-hover:shadow-xl group-hover:bg-gray-50 transition-all duration-300">
                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                          {sponsor.logo}
                        </div>
                        <h4 className="text-xs font-semibold text-gray-700 text-center leading-tight">
                          {sponsor.name}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
