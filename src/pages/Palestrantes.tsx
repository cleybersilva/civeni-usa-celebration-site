
import SpeakerCard from '@/components/SpeakerCard';
import { useCMS } from '@/contexts/CMSContext';
import { clearImageCaches, isProduction } from '@/utils/productionImageUtils';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, Calendar, Star, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
// Import para debug (remover em produção)
import '../utils/speakerImageDiagnostic';
// Import para diagnóstico de produção
import '../utils/productionDiagnostic';

const Palestrantes = () => {
  const { t } = useTranslation();
  const { content } = useCMS();

  // Limpar cache de imagens em produção
  useEffect(() => {
    if (isProduction()) {
      clearImageCaches();
      console.log('🧹 Cache de imagens limpo para produção');
    }
  }, []);

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
              <li>Palestrantes</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Palestrantes
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Conheça os especialistas de renome internacional que compartilharão seus conhecimentos no III CIVENI 2025 - 
              Líderes em educação, inovação, justiça, humanidade, religiosidade e tecnologia
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/inscricoes">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
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

      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-poppins flex items-center justify-center gap-3">
              <Star className="w-8 h-8 text-civeni-blue" />
              Nossos Palestrantes de Destaque
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Profissionais reconhecidos mundialmente que trarão as mais recentes inovações e perspectivas em suas áreas de especialidade
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {content.speakers
              .filter(speaker => speaker.id && speaker.id !== 'new')
              .sort((a, b) => a.order - b.order)
              .map((speaker) => {
                return <SpeakerCard key={speaker.id} speaker={speaker} />;
              })}
          </div>

          
          {content.speakers.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-civeni-blue/10 to-civeni-red/10 rounded-2xl p-12 max-w-2xl mx-auto">
                <Users className="w-16 h-16 text-civeni-blue mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Palestrantes em Breve
                </h3>
                <p className="text-xl text-gray-600 mb-8">
                  Estamos finalizando nossa seleção de especialistas de renome mundial. 
                  Os palestrantes serão anunciados em breve!
                </p>
                <Link to="/inscricoes">
                  <button className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto">
                    Garantir Minha Vaga
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Palestrantes;
