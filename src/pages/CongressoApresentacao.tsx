import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Users, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface CMSPageData {
  id: string;
  title: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  content_md: string;
  status: string;
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              {pageData?.hero_title || 'III CIVENI 2025'}
            </h1>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed">
                {pageData?.hero_subtitle || 'Congresso Internacional Multidisciplinar da VCCU'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link to="/inscricoes">
                    <Users className="w-5 h-5 mr-2" />
                    {t('congress.presentation.register', 'Fazer Inscrição')}
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg">
                  <Link to="/cronograma">
                    <Calendar className="w-5 h-5 mr-2" />
                    {t('congress.presentation.schedule', 'Ver Cronograma')}
                  </Link>
                </Button>
              </div>
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t('congress.presentation.why_participate', 'Por que Participar?')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('congress.presentation.why_description', 'Descubra as principais razões para fazer parte do maior evento de ensino de engenharia do Nordeste')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {t('congress.features.networking.title', 'Networking Qualificado')}
                </h3>
                <p className="text-muted-foreground">
                  {t('congress.features.networking.description', 'Conecte-se com profissionais, pesquisadores e estudantes de todo o Nordeste')}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {t('congress.features.knowledge.title', 'Conhecimento Atualizado')}
                </h3>
                <p className="text-muted-foreground">
                  {t('congress.features.knowledge.description', 'Palestras e workshops com as mais recentes tendências em educação em engenharia')}
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Play className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {t('congress.features.format.title', 'Formato Híbrido')}
                </h3>
                <p className="text-muted-foreground">
                  {t('congress.features.format.description', 'Participe presencialmente ou online, com total flexibilidade e interação')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            {t('congress.cta.title', 'Não Perca Esta Oportunidade!')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('congress.cta.description', 'Junte-se a centenas de profissionais e estudantes que estão moldando o futuro da educação em engenharia')}
          </p>
          
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
            <Link to="/inscricoes">
              {t('congress.cta.register_now', 'Inscreva-se Agora')}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default CongressoApresentacao;