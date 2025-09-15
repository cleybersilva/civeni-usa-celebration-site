
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
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li>Áreas Temáticas</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Áreas Temáticas
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Explore as principais áreas de conhecimento que serão abordadas no III CIVENI 2025 - 
              Um congresso multidisciplinar que conecta educação, inovação, justiça, humanidade, religiosidade e tecnologia
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submissao-trabalhos">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submeter Trabalho
                </button>
              </Link>
              
              <Link to="/inscricoes">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-poppins">
              Conheça Nossas Áreas de Conhecimento
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada área temática representa um pilar fundamental do conhecimento multidisciplinar que caracteriza o CIVENI
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {thematicAreas?.map((area) => {
              const { name, description } = getLocalizedContent(area);
              const IconComponent = iconMap[area.icon_name as keyof typeof iconMap] || BookOpen;
              
              return (
                <div
                  key={area.id}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
                >
                  <div className={`flex items-center justify-center w-16 h-16 bg-${area.color_class || 'civeni-blue'} rounded-full mb-6 mx-auto`}>
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
          
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white rounded-2xl p-8 max-w-4xl mx-auto shadow-xl">
              <h3 className="text-3xl font-bold mb-4 font-poppins">
                Submissão de Trabalhos
              </h3>
              <p className="text-lg opacity-90 mb-6">
                Apresente suas pesquisas e experiências em uma dessas áreas temáticas e contribua para o avanço do conhecimento multidisciplinar
              </p>
              <Link 
                to="/submissao-trabalhos"
                className="inline-flex items-center gap-2 bg-white text-civeni-blue px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition-colors font-poppins"
              >
                <FileText className="w-5 h-5" />
                Saiba Mais sobre Submissões
                <ArrowRight className="w-4 h-4" />
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
