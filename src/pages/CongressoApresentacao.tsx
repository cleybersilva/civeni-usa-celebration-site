import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Users, Calendar, Award, BookOpen, Monitor, Network, Brain, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CMSPageData {
  id: string;
  title: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  content_md: string;
  status: string;
}

// Helper to parse JSON settings embedded in content_md between markers
function parseSettings(md?: string): Record<string, any> | null {
  if (!md) return null;
  const match = md.match(/<!--\s*CMS:SETTINGS\s*(\{[\s\S]*?\})\s*-->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

const CongressoApresentacao = () => {
  const { t, i18n } = useTranslation();
  const [pageData, setPageData] = useState<CMSPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPageData();
  }, [i18n.language]);

  const fetchPageData = async () => {
    try {
      const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language;
      
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', 'congresso/apresentacao')
        .eq('locale', locale)
        .eq('status', 'published')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching page data:', error);
        
        // Fallback to Portuguese if current language not found
        if (locale !== 'pt-BR') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('cms_pages')
            .select('*')
            .eq('slug', 'congresso/apresentacao')
            .eq('locale', 'pt-BR')
            .eq('status', 'published')
            .single();
          
          if (!fallbackError && fallbackData) {
            setPageData(fallbackData);
          }
        }
        return;
      }

      if (data) {
        setPageData(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Extract optional editable settings from content_md
  const settings = parseSettings(pageData?.content_md) || {};
  const featuresTitle = settings.features_title || t('congress.presentation.why_participate', 'Por que Participar do III Civeni 2025?');
  const featuresDescription = settings.features_description || t('congress.presentation.why_description', 'Descubra as principais razões para fazer parte do maior Congresso Internacional Multidisciplinar do MUNDO');
  const feature1Title = settings.feature1_title || t('congress.features.networking.title', 'Networking Qualificado');
  const feature1Desc = settings.feature1_description || t('congress.features.networking.description', 'Conecte-se com profissionais, pesquisadores e estudantes de todo o MUNDO');
  const feature2Title = settings.feature2_title || t('congress.features.knowledge.title', 'Conhecimento Atualizado');
  const feature2Desc = settings.feature2_description || t('congress.features.knowledge.description', 'Palestras e workshops com as mais recentes tendências em educação, inovação, justiça, humanidade, religiosidade e tecnologia');
  const feature3Title = settings.feature3_title || t('congress.features.format.title', 'Formato Híbrido');
  const feature3Desc = settings.feature3_description || t('congress.features.format.description', 'Participe presencialmente ou online, com total flexibilidade e interação');
  const ctaTitle = settings.cta_title || t('congress.cta.title', 'Não Perca Esta Oportunidade!');
  const ctaDescription = settings.cta_description || t('congress.cta.description', 'Junte-se a centenas de profissionais e estudantes que estão moldando o futuro da educação com inovação, justiça, humanidade, religiosidade e tecnologia');
  const ctaButtonText = settings.cta_button_text || t('congress.cta.register_now', 'Inscreva-se Agora');
  const ctaButtonLink = settings.cta_button_link || '/inscricoes';

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li><Link to="/congresso/apresentacao" className="hover:text-blue-200 transition-colors">Congresso</Link></li>
              <li className="text-blue-200">›</li>
              <li>Apresentação</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              {pageData?.hero_title || 'III CIVENI 2025'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              {pageData?.hero_subtitle || 'Congresso Internacional Multidisciplinar da VCCU - Conheça a apresentação completa do evento, seus objetivos e a importância para a educação mundial'}
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

      {/* Main Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <article className="prose prose-lg prose-slate max-w-none dark:prose-invert">
              {pageData?.content_md ? (
                <ReactMarkdown>
                  {pageData.content_md}
                </ReactMarkdown>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>{t('congress.presentation.no_content', 'Conteúdo não disponível')}</p>
                </div>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
              {featuresTitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {featuresDescription}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Network className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-poppins group-hover:text-civeni-blue transition-colors">
                  {feature1Title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature1Desc}
                </p>
                <div className="flex items-center justify-center text-civeni-blue font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Saiba mais <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-poppins group-hover:text-civeni-blue transition-colors">
                  {feature2Title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature2Desc}
                </p>
                <div className="flex items-center justify-center text-civeni-blue font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Saiba mais <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 font-poppins group-hover:text-civeni-blue transition-colors">
                  {feature3Title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature3Desc}
                </p>
                <div className="flex items-center justify-center text-civeni-blue font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Saiba mais <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-civeni-blue via-civeni-blue to-civeni-red relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 font-poppins">
            {ctaTitle}
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            {ctaDescription}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-4 text-lg font-semibold rounded-full transition-all hover:scale-105">
              <Link to={ctaButtonLink} className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {ctaButtonText}
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20 px-8 py-4 text-lg font-semibold rounded-full transition-all hover:scale-105">
              <Link to="/programacao-presencial" className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Ver Programação
              </Link>
            </Button>
          </div>
        </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default CongressoApresentacao;