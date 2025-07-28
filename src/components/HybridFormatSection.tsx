
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';

const HybridFormatSection = () => {
  const { t } = useTranslation();
  const { content, loading } = useCMS();

  // Debug: Verificar dados carregados
  console.log('HybridFormatSection - content:', content);
  console.log('HybridFormatSection - loading:', loading);
  console.log('HybridFormatSection - content.hybridActivities:', content?.hybridActivities);

  // Dados fallback se não houver dados do banco
  const fallbackActivities = [
    {
      title: "Estandes de Exposição",
      image: "/img/formato_hibrido/estandes-exposicao.png",
      description: "Explore os estandes de tecnologia e inovação, interaja com expositores e descubra as últimas novidades do setor."
    },
    {
      title: "Palestras Magistrais",
      image: "/img/formato_hibrido/palestras-magistrais.png",
      description: "Assista às apresentações principais de especialistas renomados, abordando tendências e visões futuras da área."
    },
    {
      title: "Discussões em Painel",
      image: "/img/formato_hibrido/painel.png",
      description: "Participe de debates interativos com múltiplos especialistas, explorando diferentes perspectivas sobre temas relevantes."
    },
    {
      title: "Comunicações Orais",
      image: "/img/formato_hibrido/comunicacoes-orais.png",
      description: "Acompanhe apresentações de pesquisas acadêmicas e projetos inovadores de profissionais e estudantes."
    }
  ];

  // Verificar se existe hybridActivities e se é um array
  const hybridActivities = content?.hybridActivities || [];
  
  // Usar dados do banco se disponíveis, senão usar fallback
  const activities = hybridActivities.length > 0 
    ? hybridActivities
        .filter(activity => activity?.is_active)
        .map(activity => ({
          title: activity.title,
          image: activity.image_url,
          description: activity.description
        }))
    : fallbackActivities;

  console.log('HybridFormatSection - final activities:', activities);

  // Se ainda está carregando
  if (loading) {
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
          <div className="text-center">
            <p className="text-gray-500">Carregando atividades...</p>
          </div>
        </div>
      </section>
    );
  }

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
                    onError={(e) => {
                      console.log('Image load error for:', activity.image);
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', activity.image);
                    }}
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