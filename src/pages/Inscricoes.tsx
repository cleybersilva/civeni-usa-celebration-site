import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewRegistrationSection from '../components/NewRegistrationSection';
import { useTranslation } from 'react-i18next';

const Inscricoes = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
            {t('registration.title')}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            {t('registration.subtitle')}
          </p>
        </div>
      </section>

      {/* Registration Section */}
      <NewRegistrationSection />
      
      <Footer />
    </div>
  );
};

export default Inscricoes;