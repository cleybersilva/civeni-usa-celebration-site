
import React from 'react';
import { useTranslation } from 'react-i18next';

const VenueSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {t('venue.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('venue.description')}
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-civeni-blue to-blue-600 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 font-poppins">🏢 {t('venue.inPersonVenue')}</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Address:</h4>
                  <p className="opacity-90">
                    VCCU Conference Center<br/>
                    123 Innovation Drive<br/>
                    Celebration, FL 34747<br/>
                    United States
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">{t('venue.facilities')}:</h4>
                  <ul className="space-y-1 opacity-90">
                    <li>• State-of-the-art auditoriums</li>
                    <li>• Modern exhibition spaces</li>
                    <li>• Networking lounges</li>
                    <li>• Free Wi-Fi and parking</li>
                  </ul>
                </div>
              </div>
            </div>
            
          <div className="bg-gradient-to-br from-civeni-blue to-blue-600 text-white rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 font-poppins">💻 {t('venue.onlinePlatform')}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">YouTube Live Channel:</h4>
                <p className="opacity-90">
                  @CiveniUSA2025<br/>
                  Live streaming of keynote sessions<br/>
                  Interactive chat and Q&A
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">{t('venue.features')}:</h4>
                <ul className="space-y-1 opacity-90">
                  <li>• HD video streaming</li>
                  <li>• Real-time interaction</li>
                  <li>• Session recordings</li>
                  <li>• Digital certificates</li>
                </ul>
              </div>
            </div>
          </div>
          </div>
          
          <div className="h-96 lg:h-full min-h-[400px]">
            <div className="w-full h-full bg-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d111945.8!2d-81.3974!3d28.3595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88dd7ee634caa5f7%3A0xa71e391fd1e08fc!2sCelebration%2C%20FL%2C%20USA!5e0!3m2!1sen!2sus!4v1635000000000"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '1rem' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Venue Location - Celebration, Florida"
                sandbox="allow-scripts allow-same-origin allow-popups"
                onError={(e) => {
                  console.warn('Google Maps iframe failed to load');
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex flex-col items-center justify-center text-gray-600 bg-gray-100 rounded-2xl';
                  fallback.innerHTML = `
                    <div class="text-center p-8">
                      <div class="text-4xl mb-4">📍</div>
                      <h3 class="text-xl font-semibold mb-2">Celebration, Florida</h3>
                      <p class="text-sm">123 Innovation Drive<br>Celebration, FL 34747<br>United States</p>
                      <a href="https://maps.google.com/?q=Celebration,FL" target="_blank" rel="noopener noreferrer" 
                         class="inline-block mt-4 px-4 py-2 bg-civeni-blue text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Ver no Google Maps
                      </a>
                    </div>
                  `;
                  e.currentTarget.parentNode?.replaceChild(fallback, e.currentTarget);
                }}
              ></iframe>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-civeni-blue mb-4 font-poppins">
              {t('venue.gettingTo')}
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-civeni-red mb-2">✈️ {t('venue.byAir')}</h4>
                <p className="text-gray-600 text-sm">
                  {t('venue.airportDesc')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-civeni-red mb-2">🚗 {t('venue.byCar')}</h4>
                <p className="text-gray-600 text-sm">
                  {t('venue.carDesc')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-civeni-red mb-2">🏨 {t('venue.accommodation')}</h4>
                <p className="text-gray-600 text-sm">
                  {t('venue.hotelDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VenueSection;
