import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ExternalLink, Calendar, Presentation } from 'lucide-react';
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

const SessoesPoster = () => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<WorkContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('work_content')
        .select('*')
        .eq('work_type', 'sessoes-poster')
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Presentation className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">
                {t('works.poster.title', 'Sessões de Pôster')}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {t('works.poster.subtitle', 'Modalidade de apresentação em pôster para o III CIVENI 2025')}
            </p>
          </div>

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
                <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('works.poster.noContent', 'Conteúdo em breve')}
                </h3>
                <p className="text-muted-foreground">
                  {t('works.poster.noContentDescription', 'As informações sobre sessões de pôster serão publicadas em breve.')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SessoesPoster;