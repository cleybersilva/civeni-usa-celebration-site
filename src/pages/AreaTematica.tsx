
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BookOpen, Heart, Scale, Users, Globe, Laptop, FileText, ArrowRight } from 'lucide-react';
import { useThematicAreas } from '@/hooks/useThematicAreas';

const AreaTematica = () => {
  const { t } = useTranslation();
  const { thematicAreas, isLoading, getLocalizedContent } = useThematicAreas();

  // Icon mapping
  const iconMap = {
    BookOpen,
    Heart,
    Scale,
    Users,
    Globe,
    Laptop
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="text-xl">{t('common.loading', 'Carregando...')}</div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-12 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-6 md:mb-8 text-xs md:text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">{t('thematicAreasPage.breadcrumbHome')}</Link></li>
              <li className="text-blue-200">›</li>
              <li>{t('thematicAreasPage.pageTitle')}</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 font-poppins">
              {t('thematicAreasPage.pageTitle')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto text-blue-100 px-2">
              {t('thematicAreasPage.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
              <Link to="/submissao-trabalhos" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4 md:w-5 md:h-5" />
                  {t('thematicAreasPage.submitWork')}
                </button>
              </Link>
              
              <Link to="/inscricoes" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  {t('thematicAreasPage.registerButton')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6 font-poppins">
              {t('thematicAreasPage.sectionTitle')}
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2">
              {t('thematicAreasPage.sectionDescription')}
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {thematicAreas?.map((area, index) => {
              const { name, description } = getLocalizedContent(area);
              const IconComponent = iconMap[area.icon_name as keyof typeof iconMap] || BookOpen;
              
              // Check if this is the "Espiritualidade" card and apply centering
              const isEspiritualidade = name.toLowerCase().includes('espiritualidade') || 
                                       area.name_pt.toLowerCase().includes('espiritualidade');
              const shouldCenter = isEspiritualidade && thematicAreas.length % 3 !== 0 && 
                                 index === thematicAreas.length - 1;
              
              return (
                <div
                  key={area.id}
                  className={`bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100 ${
                    shouldCenter ? 'md:col-span-2 lg:col-span-3 max-w-md mx-auto' : ''
                  }`}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full mb-6 mx-auto">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-civeni-blue mb-4 font-poppins text-center">
                    {name}
                  </h3>
                  <p className="text-gray-700 text-center leading-relaxed">
                    {description}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 md:mt-16 text-center">
            <div className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white rounded-xl md:rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-xl">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4 font-poppins">
                {t('thematicAreasPage.submissionTitle')}
              </h3>
              <p className="text-sm sm:text-base md:text-lg opacity-90 mb-4 md:mb-6 px-2">
                {t('thematicAreasPage.submissionDescription')}
              </p>
              <Link 
                to="/submissao-trabalhos"
                className="inline-flex items-center gap-2 bg-white text-civeni-blue px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold hover:bg-white/90 transition-colors font-poppins"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                {t('thematicAreasPage.learnMoreSubmissions')}
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AreaTematica;
