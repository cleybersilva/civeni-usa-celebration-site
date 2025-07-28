
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';
import exhibitionStandsImg from '@/assets/hybrid-exhibition-stands.jpg';
import keynoteLecturesImg from '@/assets/hybrid-keynote-lectures.jpg';
import panelDiscussionsImg from '@/assets/hybrid-panel-discussions.jpg';
import oralCommunicationsImg from '@/assets/hybrid-oral-communications.jpg';

const HybridFormatSection = () => {
  const { t } = useTranslation();
  const { content } = useCMS();

  // Usar dados do banco ou fallback para valores padrão com imagens locais
  const activities = content.hybridActivities.length > 0 
    ? content.hybridActivities.map(activity => {
        // Mapear URLs do banco para imagens locais se necessário
        let imageUrl = activity.image_url;
        if (imageUrl.includes('/src/assets/hybrid-exhibition-stands.jpg')) {
          imageUrl = exhibitionStandsImg;
        } else if (imageUrl.includes('/src/assets/hybrid-keynote-lectures.jpg')) {
          imageUrl = keynoteLecturesImg;
        } else if (imageUrl.includes('/src/assets/hybrid-panel-discussions.jpg')) {
          imageUrl = panelDiscussionsImg;
        } else if (imageUrl.includes('/src/assets/hybrid-oral-communications.jpg')) {
          imageUrl = oralCommunicationsImg;
        }
        
        return {
          title: activity.title,
          image: imageUrl,
          description: activity.description
        };
      })
    : [
        {
          title: t('hybrid.exhibitionStands'),
          image: exhibitionStandsImg,
          description: t('hybrid.exhibitionDesc')
        },
        {
          title: t('hybrid.keynoteLectures'), 
          image: keynoteLecturesImg,
          description: t('hybrid.keynoteDesc')
        },
        {
          title: t('hybrid.panelDiscussions'),
          image: panelDiscussionsImg,
          description: t('hybrid.panelDesc')
        },
        {
          title: t('hybrid.oralCommunications'),
          image: oralCommunicationsImg,
          description: t('hybrid.oralDesc')
        }
      ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
            {t('hybrid.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('hybrid.description')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="relative overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-civeni-blue bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-civeni-blue mb-3 font-poppins">
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-civeni-blue mb-4 font-poppins">
              {t('hybrid.whyChoose')}
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-left">
                <h4 className="text-lg font-semibold text-civeni-red mb-3">{t('hybrid.inPersonBenefits')}</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• {t('hybrid.directNetworking')}</li>
                  <li>• {t('hybrid.handsOnWorkshops')}</li>
                  <li>• {t('hybrid.accessExhibition')}</li>
                  <li>• {t('hybrid.faceToFaceInteractions')}</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-lg font-semibold text-civeni-red mb-3">{t('hybrid.onlineBenefits')}</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• {t('hybrid.globalAccessibility')}</li>
                  <li>• {t('hybrid.costEffective')}</li>
                  <li>• {t('hybrid.recordedSessions')}</li>
                  <li>• {t('hybrid.interactiveQA')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HybridFormatSection;
