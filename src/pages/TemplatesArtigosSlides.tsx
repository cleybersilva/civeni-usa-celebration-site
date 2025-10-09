import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, ExternalLink, Users, BookOpen, Eye, FileIcon } from 'lucide-react';
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

const TemplatesArtigosSlides = () => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<WorkContent[]>([]);
  const [loading, setLoading] = useState(true);

  const articleTemplates = [
    {
      name: 'Template em Português (Word)',
      file: '/templates/template_em_Português.docx',
      type: 'docx',
      description: 'Modelo de documento para artigos acadêmicos em português',
      category: 'article'
    },
    {
      name: 'Template - English (Word)',
      file: '/templates/Template_-_English.docx',
      type: 'docx',
      description: 'Document template for academic papers in English',
      category: 'article'
    }
  ];

  const slideTemplates = [
    {
      name: 'Modelo de Slides em Português (PowerPoint)',
      file: '/templates/MODELO_DE_SLIDES_em_Português.pptx',
      type: 'pptx',
      description: 'Modelo de apresentação para slides em português',
      category: 'slide'
    },
    {
      name: 'Template for Slides (PowerPoint)',
      file: '/templates/TEMPLATE_FOR_SLIDES.pptx',
      type: 'pptx',
      description: 'Presentation template for slides in English',
      category: 'slide'
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
        .eq('work_type', 'templates-artigos-slides')
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
                <div className="flex gap-2">
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      download
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {t('common.download', 'Download')}
                    </a>
                  )}
                  {item.file_url && (
                    <button
                      onClick={() => handleManagedFilePreview(item.file_url!)}
                      className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      Visualizar
                    </button>
                  )}
                </div>
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

  const checkFileExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleDownloadClick = async (templateFile: string, templateName: string) => {
    try {
      const response = await fetch(templateFile);
      if (!response.ok) {
        throw new Error('Arquivo não encontrado');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = templateFile.split('/').pop() || templateName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro ao baixar o arquivo. Por favor, tente novamente.');
    }
  };

  const handlePreviewClick = async (templateFile: string) => {
    const absoluteUrl = new URL(templateFile, window.location.origin).href;
    
    const fileExists = await checkFileExists(absoluteUrl);
    
    if (!fileExists) {
      alert('Arquivo não encontrado. Por favor, tente fazer o download direto.');
      return;
    }
    
    const isOfficeFile = /\.(docx?|pptx?|xlsx?)$/i.test(templateFile);
    
    if (isOfficeFile) {
      const viewers = [
        `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteUrl)}`,
        `https://docs.google.com/gview?url=${encodeURIComponent(absoluteUrl)}&embedded=true`
      ];
      
      let viewerWorked = false;
      
      for (const viewerUrl of viewers) {
        try {
          const newWindow = window.open(viewerUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
          if (newWindow) {
            viewerWorked = true;
            break;
          }
        } catch (error) {
          console.log(`Viewer failed, trying next: ${error}`);
        }
      }
      
      if (!viewerWorked) {
        alert('Não foi possível abrir a pré-visualização online. Por favor, use o botão de Download.');
      }
    } else {
      window.open(absoluteUrl, '_blank');
    }
  };

  const handleManagedFilePreview = async (fileUrl: string) => {
    try {
      // Verificar se é arquivo Office
      const isOfficeFile = /\.(docx?|pptx?|xlsx?)$/i.test(fileUrl);
      
      if (isOfficeFile) {
        // Múltiplos viewers modernos
        const viewers = [
          `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`,
          `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
        ];
        
        // Tentar cada viewer
        for (const viewerUrl of viewers) {
          try {
            const newWindow = window.open(viewerUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            if (newWindow) {
              return; // Sucesso
            }
          } catch (error) {
            console.log(`Viewer failed: ${error}`);
          }
        }
        
        // Se todos falharam, abrir URL direta
        window.open(fileUrl, '_blank');
      } else {
        // Para PDFs, imagens etc, abrir diretamente
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Preview error:', error);
      window.open(fileUrl, '_blank'); // Fallback final
    }
  };

  const renderTemplateCard = (template: any, index: number) => (
    <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:scale-105">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-col items-center justify-center gap-3 text-lg text-center">
          <div className="p-2 bg-gradient-to-br from-civeni-blue to-civeni-red rounded-lg text-white">
            {template.category === 'article' ? (
              <FileText className="h-5 w-5" />
            ) : (
              <FileIcon className="h-5 w-5" />
            )}
          </div>
          <span className="group-hover:text-civeni-blue transition-colors">
            {template.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {template.description}
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleDownloadClick(template.file, template.name)}
            className="flex-1 bg-gradient-to-r from-civeni-blue to-civeni-red text-white px-4 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 font-medium"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          
          <button
            onClick={() => handlePreviewClick(template.file)}
            className="px-4 py-2.5 border-2 border-civeni-blue text-civeni-blue rounded-lg hover:bg-civeni-blue hover:text-white transition-all duration-300 flex items-center gap-2 font-medium"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </button>
        </div>
        
        <div className="p-3 bg-gradient-to-r from-blue-50 to-red-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-civeni-blue rounded-full"></div>
            <p className="text-xs font-medium text-gray-700">
              Tipo: {template.type.toUpperCase()} • 
              {template.type.includes('doc') ? ' Microsoft Word' : ' Microsoft PowerPoint'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
              <li><Link to="/submissao-trabalhos" className="hover:text-blue-200 transition-colors">Trabalhos</Link></li>
              <li className="text-blue-200">›</li>
              <li>Templates Artigos/Slides</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Templates Artigos/Slides
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Modelos padronizados para artigos acadêmicos e apresentações do III CIVENI 2025 - 
              Facilite a formatação dos seus trabalhos e apresentações
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
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-poppins flex flex-col items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-civeni-blue" />
                <span>Bem-vindos aos Templates</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Baixe os modelos padronizados para artigos acadêmicos e apresentações. 
                Todos os templates seguem as diretrizes do congresso para garantir uniformidade.
              </p>
            </div>

            <Tabs defaultValue="artigos" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="artigos" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Templates Artigos
                </TabsTrigger>
                <TabsTrigger value="slides" className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  Templates Slides
                </TabsTrigger>
                <TabsTrigger value="gerenciado" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Conteúdo Gerenciado
                </TabsTrigger>
              </TabsList>

              <TabsContent value="artigos" className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Templates para Artigos</h3>
                  <p className="text-gray-600">Modelos padronizados para formatação de artigos acadêmicos</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {articleTemplates.map(renderTemplateCard)}
                </div>
                
                <Card className="bg-gradient-to-r from-blue-50 to-red-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex flex-col items-center justify-center gap-2 text-civeni-blue text-center">
                      <BookOpen className="h-5 w-5" />
                      <span>Instruções para Templates de Artigos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                      <li>Faça o download do template na linguagem do seu artigo</li>
                      <li>Mantenha a formatação original (fontes, margens, espaçamento)</li>
                      <li>Substitua apenas o conteúdo, preservando a estrutura</li>
                      <li>Verifique as diretrizes de citação e referências</li>
                      <li>O template inclui exemplos de formatação para tabelas e figuras</li>
                      <li>Limite de páginas e outras especificações estão no template</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="slides" className="space-y-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Templates para Slides</h3>
                  <p className="text-gray-600">Modelos padronizados para apresentações do congresso</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {slideTemplates.map(renderTemplateCard)}
                </div>
                
                <Card className="bg-gradient-to-r from-blue-50 to-red-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex flex-col items-center justify-center gap-2 text-civeni-blue text-center">
                      <BookOpen className="h-5 w-5" />
                      <span>Instruções para Templates de Slides</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                      <li>Use o template correspondente ao idioma da sua apresentação</li>
                      <li>Mantenha o layout e cores do template original</li>
                      <li>Inclua título, autores e afiliação no slide inicial</li>
                      <li>Use fontes legíveis e tamanho adequado para apresentação</li>
                      <li>Limite o texto por slide para melhor visualização</li>
                      <li>Inclua slide de referências ao final da apresentação</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gerenciado">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">{t('common.loading', 'Carregando...')}</p>
                  </div>
                ) : content.length > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Conteúdo Adicional</h3>
                      <p className="text-gray-600">Materiais e recursos complementares</p>
                    </div>
                    {content.map(renderContentItem)}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Conteúdo em breve
                      </h3>
                      <p className="text-muted-foreground">
                        Recursos adicionais serão publicados em breve.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TemplatesArtigosSlides;