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
              <li>Inscrições</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Inscrições
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Garante sua participação no III CIVENI 2025 - 
              O maior Congresso Internacional Multidisciplinar do mundo em educação, inovação, justiça, humanidade, religiosidade e tecnologia
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/area-tematica">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Áreas Temáticas
                </button>
              </Link>
              
              <Link to="/programacao-presencial">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Ver Programação
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