import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Award, BookOpen, GraduationCap, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Evaluator {
  id: number;
  name: string;
  title: string;
  institution: string;
  imageUrl?: string;
}

const CongressoAvaliadores = () => {
  const { t } = useTranslation();

  const evaluators: Evaluator[] = [
    {
      id: 1,
      name: 'Profª. Drª. Marta Elisete Ventura da Motta',
      title: 'Doutora em Educação',
      institution: 'FASOL'
    },
    {
      id: 2,
      name: 'Profa. Dra. Mariane Camargo Priesnitz',
      title: 'Doutora em Educação',
      institution: 'UFSM/VENI'
    },
    {
      id: 3,
      name: 'Prof. Dr. Aprigio Telles Mascarenhas Neto',
      title: 'Doutor',
      institution: 'FASOL/VENI'
    },
    {
      id: 4,
      name: 'Prof. Dr. Margarete Luiza Alburgeri',
      title: 'Doutor',
      institution: 'UALGARVE'
    },
    {
      id: 5,
      name: 'Prof. Dr. Henrique Rodrigues Lelis',
      title: 'Doutor',
      institution: 'VCCU'
    },
    {
      id: 6,
      name: 'Prof. Dr. Mhardoquel Geraldo Lima França',
      title: 'Doutor',
      institution: 'VCCU'
    },
    {
      id: 7,
      name: 'Prof. Dr. Leonardo David Quintiliano',
      title: 'Doutor',
      institution: 'VENI'
    },
    {
      id: 8,
      name: 'Prof. Dr. Eloy Lemos Junior',
      title: 'Doutor',
      institution: 'VENI'
    },
    {
      id: 9,
      name: 'Prof. Dr. Ramon Olímpio',
      title: 'Doutor',
      institution: 'VENI'
    },
    {
      id: 10,
      name: 'Profa. Dra Vivianne de Sousa',
      title: 'Doutora',
      institution: 'VENI'
    },
    {
      id: 11,
      name: 'Profa. Dra Gabriela Marcolino',
      title: 'Doutora',
      institution: 'VENI'
    },
    {
      id: 12,
      name: 'Profa. Dra Angela Pellegrin Ansuj',
      title: 'Doutora em Educação',
      institution: 'UFSM'
    },
    {
      id: 13,
      name: 'Profa. Dra Angela Isabel dos Santos Dullius',
      title: 'Doutora em Educação',
      institution: 'UFSM'
    },
    {
      id: 14,
      name: 'Prof. Dr. Uiliam Hahn Biegelmeyer',
      title: 'Doutor',
      institution: 'UCS'
    }
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 2)
      .map(word => word[0])
      .join('');
  };

  const getGradientColor = (index: number) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600',
      'from-purple-500 to-violet-600',
      'from-red-500 to-pink-600',
      'from-orange-500 to-amber-600',
      'from-teal-500 to-cyan-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-purple-600'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-12 md:py-16 lg:py-20">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            {/* Breadcrumbs */}
            <nav className="mb-6 md:mb-8 text-xs md:text-sm">
              <ol className="flex items-center space-x-2">
                <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
                <li className="text-blue-200">›</li>
                <li><Link to="/congresso/apresentacao" className="hover:text-blue-200 transition-colors">Congresso</Link></li>
                <li className="text-blue-200">›</li>
                <li>Avaliadores</li>
              </ol>
            </nav>
            
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 font-poppins">
                Avaliadores do III CIVENI 2025
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto text-blue-100 px-2">
                Conheça nossos renomados avaliadores acadêmicos que garantem a excelência e qualidade científica do Congresso Internacional Multidisciplinar
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
                <Link to="/submissao-trabalhos" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                    Submeter Trabalho
                  </button>
                </Link>
                
                <Link to="/inscricoes" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                    Fazer Inscrição
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Evaluation Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-civeni-blue mb-4 md:mb-6 font-poppins">
                Excelência na Avaliação Científica
              </h2>
              <div className="bg-gradient-to-r from-civeni-blue/10 to-civeni-red/10 rounded-xl md:rounded-2xl p-6 md:p-8 mb-6 md:mb-8">
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">
                  Nosso corpo de avaliadores é composto por <strong>doutores renomados</strong> de instituições nacionais e internacionais, 
                  garantindo que todos os trabalhos submetidos ao III CIVENI 2025 sejam avaliados com o mais alto rigor científico 
                  e acadêmico, seguindo os padrões internacionais de pesquisa.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-civeni-blue mb-2">Rigor Científico</h3>
                    <p className="text-gray-600">Avaliação baseada em critérios internacionais de qualidade acadêmica</p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-civeni-blue mb-2">Expertise Multidisciplinar</h3>
                    <p className="text-gray-600">Doutores especializados em diversas áreas do conhecimento</p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-civeni-blue mb-2">Reconhecimento Internacional</h3>
                    <p className="text-gray-600">Avaliadores de instituições nacionais e internacionais renomadas</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Evaluators Grid Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-civeni-blue mb-4 md:mb-6 font-poppins">
                Nossos Avaliadores
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
                Conheça os doutores que compõem nosso renomado corpo de avaliadores acadêmicos
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {evaluators.map((evaluator, index) => (
                <Card key={evaluator.id} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-6 text-center relative z-10">
                    <div className={`w-20 h-20 bg-gradient-to-br ${getGradientColor(index)} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <span className="text-white font-bold text-lg">
                        {getInitials(evaluator.name)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 font-poppins group-hover:text-civeni-blue transition-colors leading-tight">
                      {evaluator.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      {evaluator.title}
                    </p>
                    <p className="text-sm text-civeni-blue font-semibold">
                      {evaluator.institution}
                    </p>
                    <div className="flex items-center justify-center text-civeni-blue font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-3">
                      <Star className="w-4 h-4 mr-1" />
                      Avaliador
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-r from-civeni-blue via-civeni-blue to-civeni-red relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 font-poppins px-2">
              Submeta Seu Trabalho
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2">
              Tenha seu trabalho avaliado por nosso renomado corpo de doutores e faça parte do maior congresso internacional multidisciplinar do mundo
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
              <Link to="/submissao-trabalhos" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  Submeter Trabalho
                </button>
              </Link>
              
              <Link to="/inscricoes" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-transparent text-white hover:bg-white hover:text-civeni-blue border-2 border-white px-6 py-3 md:px-8 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 md:w-5 md:h-5" />
                  Fazer Inscrição
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default CongressoAvaliadores;