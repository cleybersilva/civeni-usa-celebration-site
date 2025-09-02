import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Globe, FileText, Trash2 } from 'lucide-react';
import SimpleImageUpload from '../SimpleImageUpload';
import ReactMarkdown from 'react-markdown';

interface CMSPage {
  id?: string;
  slug: string;
  locale: string;
  title: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  content_md?: string;
  status: 'draft' | 'published';
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

const CMSPagesManager = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pt-BR');
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('congresso/apresentacao');
  
  const [formData, setFormData] = useState<CMSPage>({
    slug: 'congresso/apresentacao',
    locale: 'pt-BR',
    title: '',
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    content_md: '',
    status: 'published'
  });

  useEffect(() => {
    fetchPages();
  }, [selectedSlug]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', selectedSlug)
        .order('locale');

      if (error) {
        console.error('Error fetching pages:', error);
        return;
      }

      setPages((data || []) as CMSPage[]);
      
      // Set form data to the first page found or create empty form
      const currentLocalePage = (data || []).find(p => p.locale === activeTab);
      if (currentLocalePage) {
        setFormData(currentLocalePage as CMSPage);
      } else {
        setFormData({
          slug: selectedSlug,
          locale: activeTab,
          title: '',
          hero_title: '',
          hero_subtitle: '',
          hero_image_url: '',
          content_md: '',
          status: 'published'
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);
    try {
      if (formData.id) {
        // Update existing page
        const { error } = await supabase
          .from('cms_pages')
          .update({
            title: formData.title,
            hero_title: formData.hero_title,
            hero_subtitle: formData.hero_subtitle,
            hero_image_url: formData.hero_image_url,
            content_md: formData.content_md,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Insert new page
        const { error } = await supabase
          .from('cms_pages')
          .insert([{
            slug: formData.slug,
            locale: formData.locale,
            title: formData.title,
            hero_title: formData.hero_title,
            hero_subtitle: formData.hero_subtitle,
            hero_image_url: formData.hero_image_url,
            content_md: formData.content_md,
            status: formData.status
          }]);

        if (error) throw error;
      }

      toast.success('Página salva com sucesso!');
      fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Erro ao salvar página');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    
    if (!confirm('Tem certeza que deseja excluir esta página?')) return;

    try {
      const { error } = await supabase
        .from('cms_pages')
        .delete()
        .eq('id', formData.id);

      if (error) throw error;

      toast.success('Página excluída com sucesso!');
      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Erro ao excluir página');
    }
  };

  const handleInputChange = (field: keyof CMSPage, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      hero_image_url: url
    }));
  };

  const handleTabChange = (locale: string) => {
    setActiveTab(locale);
    const pageInLocale = pages.find(p => p.locale === locale);
    if (pageInLocale) {
      setFormData(pageInLocale);
    } else {
      setFormData({
        slug: selectedSlug,
        locale: locale,
        title: '',
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: '',
        content_md: '',
        status: 'published'
      });
    }
  };

  const getPageUrl = (slug: string) => {
    return `/${slug.replace('/', '/')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t('admin.cms.pages.title', 'Gerenciar Páginas CMS')}
          </h2>
          <p className="text-muted-foreground">
            {t('admin.cms.pages.description', 'Configure o conteúdo das páginas do site')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            asChild
            className="flex items-center gap-2"
          >
            <a href={getPageUrl(selectedSlug)} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" />
              {t('admin.preview', 'Visualizar')}
            </a>
          </Button>
          
          {formData.id && (
            <Button 
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          )}
          
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? t('admin.saving', 'Salvando...') : t('admin.save', 'Salvar')}
          </Button>
        </div>
      </div>

      {/* Page Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Selecionar Página
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSlug} onValueChange={setSelectedSlug}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="congresso/apresentacao">Congresso - Apresentação</SelectItem>
              {/* Add more pages here as needed */}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Multilingual Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('admin.multilingual_content', 'Conteúdo Multilíngue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pt-BR">Português</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Español</TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título da Página *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Título interno da página"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hero_title">Título Principal (Hero)</Label>
                    <Input
                      id="hero_title"
                      value={formData.hero_title || ''}
                      onChange={(e) => handleInputChange('hero_title', e.target.value)}
                      placeholder="Título principal da página"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="hero_subtitle">Subtítulo (Hero)</Label>
                    <Input
                      id="hero_subtitle"
                      value={formData.hero_subtitle || ''}
                      onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                      placeholder="Subtítulo da página"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Imagem Principal (Hero)</Label>
                  <SimpleImageUpload
                    value={formData.hero_image_url || ''}
                    onChange={handleImageUpload}
                    label="Imagem Principal"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="content_md">Conteúdo (Markdown)</Label>
                <Textarea
                  id="content_md"
                  value={formData.content_md || ''}
                  onChange={(e) => handleInputChange('content_md', e.target.value)}
                  placeholder="Conteúdo em Markdown..."
                  rows={12}
                  className="font-mono"
                />
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold">{formData.hero_title}</h3>
              <p className="text-lg text-muted-foreground">{formData.hero_subtitle}</p>
            </div>
            
            {formData.hero_image_url && (
              <img
                src={formData.hero_image_url}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            
            {formData.content_md && (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{formData.content_md}</ReactMarkdown>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CMSPagesManager;