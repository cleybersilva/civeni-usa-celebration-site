
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewRegistrationSection from '@/components/NewRegistrationSection';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';

const InscricaoOnline = () => {
  const { t } = useTranslation();
  const { content } = useCMS();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-civeni-red to-red-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-poppins">
            {t('registration.onlineTitle', 'Inscrição Online')}
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            {t('registration.onlineDescription', 'Participe do evento de qualquer lugar do mundo com transmissão ao vivo e interação digital.')}
          </p>
        </div>
      </section>

      {/* Registration Form */}
      <NewRegistrationSection registrationType="online" />
      
      {/* Online Schedule */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
              {t('schedule.onlineSchedule', 'Cronograma Online')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('schedule.onlineScheduleDescription', 'Confira a programação completa para participantes online')}
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-civeni-red to-red-600 p-8 text-white">
                <h3 className="text-3xl font-bold font-poppins mb-4">Programação Online</h3>
                <p className="text-lg opacity-90">Transmissão ao vivo com interação digital</p>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  <div className="border-l-4 border-civeni-red pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">08:45 - 09:00</h4>
                    <h5 className="text-lg font-semibold mb-2">Abertura da Transmissão</h5>
                    <p className="text-gray-600">Teste de conexão e boas-vindas aos participantes online</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-blue pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">09:00 - 10:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Conferência Magna (Ao Vivo)</h5>
                    <p className="text-gray-600">Transmissão da palestra principal com chat interativo</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-green pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">10:30 - 11:00</h4>
                    <h5 className="text-lg font-semibold mb-2">Q&A Online</h5>
                    <p className="text-gray-600">Sessão de perguntas e respostas via chat</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-red pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">11:00 - 12:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Mesa Redonda (Ao Vivo)</h5>
                    <p className="text-gray-600">Discussão transmitida com participação via chat</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-blue pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">14:00 - 15:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Webinar Interativo</h5>
                    <p className="text-gray-600">Sessão exclusiva para participantes online</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-green pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">15:30 - 16:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Apresentações Digitais</h5>
                    <p className="text-gray-600">Apresentação de trabalhos em formato digital</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-red pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">16:30 - 17:00</h4>
                    <h5 className="text-lg font-semibold mb-2">Encerramento Online</h5>
                    <p className="text-gray-600">Considerações finais e informações sobre certificado digital</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default InscricaoOnline;
