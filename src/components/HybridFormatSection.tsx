
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';

const HybridFormatSection = () => {
  const { t } = useTranslation();
  const { content, loading } = useCMS();

  console.log('HybridFormatSection - Content loaded:', !loading);
  console.log('HybridFormatSection - Raw hybridActivities:', content.hybridActivities);

  // Usar os dados do CMS, ordenados por order_index
  const activities = content.hybridActivities
    .filter(activity => activity.is_active)
    .sort((a, b) => a.order_index - b.order_index)
    .map(activity => ({
      title: activity.title,
      image: activity.image_url,
      description: activity.description
    }));

  console.log('HybridFormatSection - Processed activities:', activities);

  // Se estiver carregando ou não houver atividades, mostrar fallback
  if (loading || activities.length === 0) {
    console.log('HybridFormatSection - Using fallback data');
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
    
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
              Formato Híbrido
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experimente o melhor dos dois mundos com nosso formato híbrido inovador
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {fallbackActivities.map((activity, index) => (
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
                        console.error('Image failed to load:', activity.image);
                        e.currentTarget.src = '/placeholder.svg';
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
                Por que escolher nosso formato híbrido?
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-civeni-red mb-3">Benefícios Presenciais</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Networking direto com participantes</li>
                    <li>• Workshops práticos e interativos</li>
                    <li>• Acesso aos estandes de exposição</li>
                    <li>• Interações face a face</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-civeni-red mb-3">Benefícios Online</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Acessibilidade global</li>
                    <li>• Custo-benefício otimizado</li>
                    <li>• Sessões gravadas disponíveis</li>
                    <li>• Q&A interativo</li>
                  </ul>
                </div>
              </div>
            </div>
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
            Formato Híbrido
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experimente o melhor dos dois mundos com nosso formato híbrido inovador
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
              Por que escolher nosso formato híbrido?
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-left">
                <h4 className="text-lg font-semibold text-civeni-red mb-3">Benefícios Presenciais</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Networking direto com participantes</li>
                  <li>• Workshops práticos e interativos</li>
                  <li>• Acesso aos estandes de exposição</li>
                  <li>• Interações face a face</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-lg font-semibold text-civeni-red mb-3">Benefícios Online</h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Acessibilidade global</li>
                  <li>• Custo-benefício otimizado</li>
                  <li>• Sessões gravadas disponíveis</li>
                  <li>• Q&A interativo</li>
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