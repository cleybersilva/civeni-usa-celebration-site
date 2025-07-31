import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PoliticasPrivacidade = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-8 font-poppins text-center">
            {t('privacy.title')}
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <div className="bg-gray-50 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.lastUpdated')}</h2>
              <p className="text-gray-600">15 de janeiro de 2025</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.introduction.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.introduction.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.dataCollection.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.dataCollection.content')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('privacy.dataCollection.personalInfo')}</li>
                <li>{t('privacy.dataCollection.contactInfo')}</li>
                <li>{t('privacy.dataCollection.academicInfo')}</li>
                <li>{t('privacy.dataCollection.paymentInfo')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.dataUse.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.dataUse.content')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('privacy.dataUse.registration')}</li>
                <li>{t('privacy.dataUse.communication')}</li>
                <li>{t('privacy.dataUse.certificates')}</li>
                <li>{t('privacy.dataUse.statistics')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.dataProtection.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.dataProtection.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.userRights.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.userRights.content')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>{t('privacy.userRights.access')}</li>
                <li>{t('privacy.userRights.correction')}</li>
                <li>{t('privacy.userRights.deletion')}</li>
                <li>{t('privacy.userRights.portability')}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.cookies.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.cookies.content')}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.contact.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.contact.content')}
              </p>
              <div className="bg-civeni-blue text-white p-6 rounded-lg">
                <p className="mb-2">📧 Email: contact@civeni.com</p>
                <p className="mb-2">📞 Telefone: +1 (407) 555-0123</p>
                <p>📍 Endereço: Celebration, FL 34747, USA</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-4">{t('privacy.changes.title')}</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {t('privacy.changes.content')}
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PoliticasPrivacidade;