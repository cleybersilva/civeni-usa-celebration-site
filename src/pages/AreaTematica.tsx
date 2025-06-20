
import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BookOpen, Lightbulb, Users, Globe, Brain, Laptop } from 'lucide-react';

const AreaTematica = () => {
  const { t } = useTranslation();

  const thematicAreas = [
    {
      id: 1,
      icon: BookOpen,
      name: "Educação e Tecnologia",
      description: "Inovações tecnológicas no processo educativo e metodologias de ensino digital."
    },
    {
      id: 2,
      icon: Lightbulb,
      name: "Metodologias Inovadoras",
      description: "Novas abordagens pedagógicas e estratégias de ensino-aprendizagem."
    },
    {
      id: 3,
      icon: Users,
      name: "Formação Docente",
      description: "Capacitação e desenvolvimento profissional de educadores."
    },
    {
      id: 4,
      icon: Globe,
      name: "Educação Global",
      description: "Perspectivas internacionais e multiculturais na educação."
    },
    {
      id: 5,
      icon: Brain,
      name: "Neuroeducação",
      description: "Aplicação de conhecimentos neurocientíficos no processo educativo."
    },
    {
      id: 6,
      icon: Laptop,
      name: "Educação Digital",
      description: "Ensino a distância, plataformas digitais e ambientes virtuais de aprendizagem."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
              Áreas Temáticas do Evento
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore as principais áreas de conhecimento que serão abordadas no III CIVENI USA 2025
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {thematicAreas.map((area) => (
              <div
                key={area.id}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-civeni-blue rounded-full mb-6 mx-auto">
                  <area.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-civeni-blue mb-4 font-poppins text-center">
                  {area.name}
                </h3>
                <p className="text-gray-700 text-center leading-relaxed">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <div className="bg-civeni-blue text-white rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4 font-poppins">
                Submissão de Trabalhos
              </h3>
              <p className="text-lg opacity-90 mb-6">
                Apresente suas pesquisas e experiências em uma dessas áreas temáticas
              </p>
              <button className="bg-civeni-red text-white px-8 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors font-poppins">
                Saiba Mais sobre Submissões
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AreaTematica;
