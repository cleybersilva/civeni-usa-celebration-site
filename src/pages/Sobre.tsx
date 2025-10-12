import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Sobre = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <nav className="text-sm mb-6 opacity-90">
            <Link to="/" className="hover:text-civeni-red transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span>Sobre</span>
          </nav>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
            Sobre o CIVENI
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Congresso Internacional Multidisciplinar
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Quem somos */}
          <section>
            <h2 className="text-3xl font-bold text-civeni-blue mb-6">Quem somos</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              O CIVENI é um congresso internacional e híbrido que conecta ciência, educação, inovação e impacto social. A cada edição, reunimos palestrantes do Brasil e do mundo, com atividades presenciais e online para ampliar o acesso ao conhecimento — sem barreiras geográficas.
            </p>
          </section>

          {/* Nossa proposta */}
          <section>
            <h2 className="text-3xl font-bold text-civeni-blue mb-6">Nossa proposta</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Levamos conteúdo multidisciplinar em formatos diversos (palestras, painéis, comunicações orais e atividades culturais), com transmissões ao vivo quando aplicável e certificação por atividade. Tudo pensado para quem estuda, pesquisa, empreende e transforma realidades.
            </p>
          </section>

          {/* Como funciona */}
          <section>
            <h2 className="text-3xl font-bold text-civeni-blue mb-6">Como funciona (formato híbrido)</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-civeni-blue mb-3">Presencial</h3>
                  <p className="text-gray-700">Programação dedicada com cronograma próprio.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-civeni-blue mb-3">Online</h3>
                  <p className="text-gray-700">Trilha remota with atividades ao vivo.</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mt-6">
              <strong>Transmissão:</strong> uso de plataformas como YouTube (seleção de falas) e Google Meet (apresentações orais), conforme prática comunicada em edições anteriores.
            </p>
          </section>

          {/* Público e áreas temáticas */}
          <section>
            <h2 className="text-3xl font-bold text-civeni-blue mb-6">Público e áreas temáticas</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              O CIVENI dialoga com estudantes, docentes, pesquisadores e profissionais de diferentes áreas do conhecimento, articuladas em áreas temáticas que mudam a cada edição.
            </p>
          </section>

          {/* Palestrantes */}
          <section>
            <h2 className="text-3xl font-bold text-civeni-blue mb-6">Palestrantes</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Contamos com palestrantes nacionais e internacionais de referência, em agenda divulgada na página de Palestrantes.
            </p>
          </section>

          {/* Inscrições e certificação */}
          <section>
            <h2 className="text-3xl font-bold text-civeni-blue mb-6">Inscrições e certificação</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              As inscrições são realizadas pelo site. A certificação por atividade é informada no regulamento/área de inscrições e comunicados oficiais de cada edição.
            </p>
          </section>

          {/* Contato institucional */}
          <section>
            <h2 className="text-3xl font-bold text-civeni-blue mb-6">Contato institucional</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Dúvidas, parcerias e imprensa: utilize a página de Contato. (Enquanto a versão em PT não estiver publicada, o endereço ativo é o contato em EN.)
            </p>
          </section>

          {/* CTAs */}
          <section className="bg-gray-50 rounded-lg p-8 mt-12">
            <h2 className="text-2xl font-bold text-civeni-blue mb-6 text-center">Explore o CIVENI</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="bg-civeni-blue hover:bg-civeni-blue/90">
                <Link to="/cronograma-presencial">Ver Programação</Link>
              </Button>
              <Button asChild variant="outline" className="border-civeni-blue text-civeni-blue hover:bg-civeni-blue hover:text-white">
                <Link to="/palestrantes">Palestrantes</Link>
              </Button>
              <Button asChild className="bg-civeni-red hover:bg-civeni-red/90">
                <Link to="/inscricoes">Inscrições</Link>
              </Button>
              <Button asChild variant="outline" className="border-civeni-red text-civeni-red hover:bg-civeni-red hover:text-white">
                <Link to="/contato">Contato</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Sobre;