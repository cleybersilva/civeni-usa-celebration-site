
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewRegistrationSection from '@/components/NewRegistrationSection';
import { useTranslation } from 'react-i18next';

const InscricaoPresencial = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="bg-gradient-to-r from-civeni-blue to-blue-700 text-white py-16">
        <div className="w-full text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-poppins">
            {t('registration.presentialTitle', 'Inscrição Presencial')}
          </h1>
          <p className="text-xl max-w-3xl mx-auto">
            {t('registration.presentialDescription', 'Participe presencialmente do evento com networking direto, workshops interativos e acesso completo às atividades.')}
          </p>
        </div>
      </section>

      <NewRegistrationSection registrationType="presencial" />
      
      <section className="py-20 bg-white">
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
              {t('schedule.inPersonSchedule', 'Cronograma Presencial')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('schedule.inPersonScheduleDescription', 'Confira a programação completa para participantes presenciais')}
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-civeni-blue to-blue-600 p-8 text-white">
                <h3 className="text-3xl font-bold font-poppins mb-4">Programação Presencial</h3>
                <p className="text-lg opacity-90">Experiência completa com networking e interação direta</p>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  <div className="border-l-4 border-civeni-blue pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">08:00 - 09:00</h4>
                    <h5 className="text-lg font-semibold mb-2">Credenciamento e Coffee Break</h5>
                    <p className="text-gray-600">Recepção dos participantes e networking inicial</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-green pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">09:00 - 10:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Conferência Magna</h5>
                    <p className="text-gray-600">Palestra principal com especialista renomado</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-red pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">10:30 - 11:00</h4>
                    <h5 className="text-lg font-semibold mb-2">Intervalo</h5>
                    <p className="text-gray-600">Networking e coffee break</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-blue pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">11:00 - 12:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Mesa Redonda</h5>
                    <p className="text-gray-600">Discussão com múltiplos especialistas</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-green pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">14:00 - 15:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Workshops Práticos</h5>
                    <p className="text-gray-600">Atividades interativas em grupos menores</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-red pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">15:30 - 17:00</h4>
                    <h5 className="text-lg font-semibold mb-2">Apresentação de Trabalhos</h5>
                    <p className="text-gray-600">Sessão de apresentações dos participantes</p>
                  </div>
                  
                  <div className="border-l-4 border-civeni-blue pl-6">
                    <h4 className="text-xl font-bold text-civeni-blue mb-2">17:00 - 17:30</h4>
                    <h5 className="text-lg font-semibold mb-2">Encerramento</h5>
                    <p className="text-gray-600">Considerações finais e entrega de certificados</p>
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

export default InscricaoPresencial;
