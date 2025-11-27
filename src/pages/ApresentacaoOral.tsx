import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, ExternalLink, Calendar, Users, BookOpen, Eye } from 'lucide-react';
import { createSafeHtml } from '@/utils/sanitizeHtml';

interface WorkContent {
  id: string;
  content_type: string;
  title_pt?: string;
  title_en?: string;
  title_es?: string;
  content_pt?: string;
  content_en?: string;
  content_es?: string;
  file_url?: string;
  file_name?: string;
  link_url?: string;
  order_index: number;
}

const ApresentacaoOral = () => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<WorkContent[]>([]);
  const [loading, setLoading] = useState(true);

  const templates = [
    {
      name: 'Template em Português (Word)',
      file: '/templates/template_em_Português.docx',
      type: 'docx',
      description: 'Modelo de documento para trabalhos em português'
    },
    {
      name: 'Template - English (Word)',
      file: '/templates/Template_-_English.docx',
      type: 'docx',
      description: 'Document template for papers in English'
    },
    {
      name: 'Modelo de Slides em Português (PowerPoint)',
      file: '/templates/MODELO_DE_SLIDES_em_Português.ppt',
      type: 'ppt',
      description: 'Modelo de apresentação para slides em português'
    },
    {
      name: 'Template for Slides (PowerPoint)',
      file: '/templates/TEMPLATE_FOR_SLIDES.pptx',
      type: 'pptx',
      description: 'Presentation template for slides in English'
    }
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('work_content')
        .select('*')
        .eq('work_type', 'apresentacao-oral')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedContent = (item: WorkContent, field: 'title' | 'content') => {
    const lang = i18n.language;
    if (lang === 'en') return item[`${field}_en`] || item[`${field}_pt`];
    if (lang === 'es') return item[`${field}_es`] || item[`${field}_pt`];
    return item[`${field}_pt`];
  };

  const renderContentItem = (item: WorkContent) => {
    const title = getLocalizedContent(item, 'title');
    const content = getLocalizedContent(item, 'content');

    switch (item.content_type) {
      case 'text':
        return (
          <Card key={item.id} className="mb-6">
            {title && (
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {title}
                </CardTitle>
              </CardHeader>
            )}
            {content && (
              <CardContent>
                <div dangerouslySetInnerHTML={createSafeHtml(content)} />
              </CardContent>
            )}
          </Card>
        );

      case 'file':
        return (
          <Card key={item.id} className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Download className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">{title || item.file_name}</h3>
                  {content && <p className="text-sm text-muted-foreground">{content}</p>}
                </div>
                {item.file_url && (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {t('common.download', 'Download')}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'link':
        return (
          <Card key={item.id} className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ExternalLink className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">{title}</h3>
                  {content && <p className="text-sm text-muted-foreground">{content}</p>}
                </div>
                {item.link_url && (
                  <a
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {t('common.access', 'Acessar')}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'image':
        return (
          <Card key={item.id} className="mb-6">
            {title && (
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
            )}
            <CardContent>
              {item.file_url && (
                <img
                  src={item.file_url}
                  alt={title || ''}
                  className="w-full h-auto rounded-lg"
                />
              )}
              {content && (
                <div className="mt-4" dangerouslySetInnerHTML={createSafeHtml(content)} />
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

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
              <li><Link to="/submissao-trabalhos" className="hover:text-blue-200 transition-colors">{t('works.breadcrumb')}</Link></li>
              <li className="text-blue-200">›</li>
              <li>{t('works.oral.title')}</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 font-poppins">
              {t('works.oral.title')}
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-blue-100">
              {t('works.oral.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/submissao-trabalhos" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('works.submitWork')}
                </button>
              </Link>
              
              <Link to="/inscricoes" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('works.makeRegistration')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-poppins flex items-center justify-center gap-3">
                <Users className="w-8 h-8 text-civeni-blue" />
                {t('works.oral.pageTitle')}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {t('works.oral.infoDescription')}
              </p>
            </div>

            <Tabs defaultValue="lista" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1 bg-gray-100 rounded-lg">
                <TabsTrigger value="lista" className="py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-red data-[state=active]:text-white rounded-md transition-all duration-300 data-[state=active]:shadow-md font-semibold">Lista</TabsTrigger>
                <TabsTrigger value="template" className="py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-red data-[state=active]:text-white rounded-md transition-all duration-300 data-[state=active]:shadow-md font-semibold">Template</TabsTrigger>
              </TabsList>

              <TabsContent value="lista">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">{t('common.loading', 'Carregando...')}</p>
                  </div>
                ) : content.length > 0 ? (
                  content.map(renderContentItem)
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {t('works.oral.noContent', 'Conteúdo em breve')}
                      </h3>
                      <p className="text-muted-foreground">
                        {t('works.oral.noContentDescription', 'As informações sobre apresentação oral serão publicadas em breve.')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="template">
                <div className="grid gap-6 md:grid-cols-2">
                  {templates.map((template, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-civeni-blue" />
                          {template.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {template.description}
                        </p>
                        
                        <div className="flex gap-2">
                          <a
                            href={template.file}
                            download
                            className="flex-1 bg-civeni-blue text-white px-4 py-2 rounded-md hover:bg-civeni-blue/90 transition-colors flex items-center justify-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                          
                          <button
                            onClick={() => window.open(template.file, '_blank')}
                            className="px-4 py-2 border border-civeni-blue text-civeni-blue rounded-md hover:bg-civeni-blue/10 transition-colors flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </button>
                        </div>
                        
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <p className="text-xs text-gray-600">
                            Tipo: {template.type.toUpperCase()} • 
                            {template.type.includes('doc') ? ' Microsoft Word' : ' Microsoft PowerPoint'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-civeni-blue" />
                      Instruções de Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                      <li>Faça o download do template apropriado para seu trabalho</li>
                      <li>Use o Preview para visualizar o arquivo antes do download</li>
                      <li>Os templates em português são para trabalhos em língua portuguesa</li>
                      <li>Os templates em inglês são para trabalhos em língua inglesa</li>
                      <li>Siga as formatações e estruturas definidas nos templates</li>
                      <li>Mantenha a formatação original para garantir padronização</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApresentacaoOral;