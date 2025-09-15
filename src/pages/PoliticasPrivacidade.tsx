import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Shield, FileText, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PoliticasPrivacidade = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />
      
      {/* Hero Section with Banner */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li>Políticas de Privacidade</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              {t('privacy.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Transparência e proteção dos seus dados pessoais são nossa prioridade no III CIVENI 2025
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contato">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Entrar em Contato
                </button>
              </Link>
              
              <Link to="/inscricoes">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          
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