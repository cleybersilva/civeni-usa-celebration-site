import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const EventoDetalhes = () => {
  const { slug } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section - Same style as Eventos page */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li><Link to="/eventos" className="hover:text-blue-200 transition-colors">Eventos</Link></li>
              <li className="text-blue-200">›</li>
              <li>Detalhes do Evento</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Evento: {slug}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Página de detalhes funcionando!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/eventos">
                <Button className="bg-white text-civeni-blue hover:bg-white/90">
                  Voltar para Eventos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Teste de Rota</h2>
          <p className="text-gray-600 mb-4">
            Se você está vendo esta página, a rota está funcionando corretamente.
          </p>
          <p className="text-sm text-gray-500">
            Slug: <code className="bg-gray-100 px-2 py-1 rounded">{slug}</code>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EventoDetalhes;