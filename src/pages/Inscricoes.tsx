import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, FileText, CreditCard } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewRegistrationSection from '../components/NewRegistrationSection';
import { useTranslation } from 'react-i18next';

const Inscricoes = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li>{t('registration.title')}</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              {t('registration.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              {t('registration.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
              <Link to="/area-tematica" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 md:w-5 md:h-5" />
                  {t('registration.thematicAreas')}
                </button>
              </Link>
              
              <Link to="/programacao-presencial" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                  {t('registration.viewSchedule')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <NewRegistrationSection />
      
      <Footer />
    </div>
  );
};

export default Inscricoes;