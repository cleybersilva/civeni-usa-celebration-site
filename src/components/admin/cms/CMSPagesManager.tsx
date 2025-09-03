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

interface PageSettings {
  features_title?: string;
  features_description?: string;
  feature1_title?: string;
  feature1_description?: string;
  feature2_title?: string;
  feature2_description?: string;
  feature3_title?: string;
  feature3_description?: string;
  cta_title?: string;
  cta_description?: string;
  cta_button_text?: string;
  cta_button_link?: string;
}

const CMSPagesManager = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pt-BR');
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('congresso/apresentacao');
  const [pageSettings, setPageSettings] = useState<PageSettings>({});
  
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

  // Helper function to parse settings from content_md
  const parseSettings = (contentMd?: string): PageSettings => {
    if (!contentMd) return {};
    const match = contentMd.match(/<!--\s*CMS:SETTINGS\s*(\{[\s\S]*?\})\s*-->/);
    if (!match) return {};
    try {
      return JSON.parse(match[1]);
    } catch {
      return {};
    }
  };

  // Helper function to update settings in content_md
  const updateContentWithSettings = (contentMd: string = '', settings: PageSettings): string => {
    const settingsJson = JSON.stringify(settings, null, 2);
    const settingsBlock = `<!-- CMS:SETTINGS ${settingsJson} -->`;
    
    // If settings block exists, replace it
    if (contentMd.includes('<!-- CMS:SETTINGS')) {
      return contentMd.replace(/<!--\s*CMS:SETTINGS\s*\{[\s\S]*?\}\s*-->/, settingsBlock);
    } else {
      // Add settings block at the beginning
      return settingsBlock + '\n\n' + contentMd;
    }
  };

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
        setPageSettings(parseSettings(currentLocalePage.content_md));
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
        setPageSettings({});
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
      // Update content with settings
      const updatedContentMd = updateContentWithSettings(formData.content_md, pageSettings);
      
      if (formData.id) {
        // Update existing page
        const { error } = await supabase
          .from('cms_pages')
          .update({
            title: formData.title,
            hero_title: formData.hero_title,
            hero_subtitle: formData.hero_subtitle,
            hero_image_url: formData.hero_image_url,
            content_md: updatedContentMd,
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
            content_md: updatedContentMd,
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
      setPageSettings(parseSettings(pageInLocale.content_md));
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
      setPageSettings({});
    }
  };

  const handleSettingsChange = (field: keyof PageSettings, value: string) => {
    setPageSettings(prev => ({
      ...prev,
      [field]: value
    }));
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
              <SelectItem value="congresso/comite">Congresso - Comitê</SelectItem>
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

              {/* Page-specific settings */}
              {selectedSlug === 'congresso/apresentacao' && (
                <Card className="p-4 bg-muted/30">
                  <h3 className="text-lg font-semibold mb-4">Configurações da Página de Apresentação</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Features Section */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Seção "Por que Participar?"</h4>
                      <div>
                        <Label>Título da Seção</Label>
                        <Input
                          value={pageSettings.features_title || ''}
                          onChange={(e) => handleSettingsChange('features_title', e.target.value)}
                          placeholder="Por que Participar?"
                        />
                      </div>
                      <div>
                        <Label>Descrição da Seção</Label>
                        <Textarea
                          value={pageSettings.features_description || ''}
                          onChange={(e) => handleSettingsChange('features_description', e.target.value)}
                          placeholder="Descubra as principais razões..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Feature 1 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Benefício 1</h4>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={pageSettings.feature1_title || ''}
                          onChange={(e) => handleSettingsChange('feature1_title', e.target.value)}
                          placeholder="Networking Qualificado"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={pageSettings.feature1_description || ''}
                          onChange={(e) => handleSettingsChange('feature1_description', e.target.value)}
                          placeholder="Conecte-se com profissionais..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Benefício 2</h4>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={pageSettings.feature2_title || ''}
                          onChange={(e) => handleSettingsChange('feature2_title', e.target.value)}
                          placeholder="Conhecimento Atualizado"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={pageSettings.feature2_description || ''}
                          onChange={(e) => handleSettingsChange('feature2_description', e.target.value)}
                          placeholder="Palestras e workshops..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Benefício 3</h4>
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={pageSettings.feature3_title || ''}
                          onChange={(e) => handleSettingsChange('feature3_title', e.target.value)}
                          placeholder="Formato Híbrido"
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={pageSettings.feature3_description || ''}
                          onChange={(e) => handleSettingsChange('feature3_description', e.target.value)}
                          placeholder="Participe presencialmente ou online..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* CTA Section */}
                    <div className="space-y-3 lg:col-span-2">
                      <h4 className="font-medium">Seção "Call to Action"</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div>
                          <Label>Título da CTA</Label>
                          <Input
                            value={pageSettings.cta_title || ''}
                            onChange={(e) => handleSettingsChange('cta_title', e.target.value)}
                            placeholder="Não Perca Esta Oportunidade!"
                          />
                        </div>
                        <div>
                          <Label>Texto do Botão</Label>
                          <Input
                            value={pageSettings.cta_button_text || ''}
                            onChange={(e) => handleSettingsChange('cta_button_text', e.target.value)}
                            placeholder="Inscreva-se Agora"
                          />
                        </div>
                        <div>
                          <Label>Link do Botão</Label>
                          <Input
                            value={pageSettings.cta_button_link || ''}
                            onChange={(e) => handleSettingsChange('cta_button_link', e.target.value)}
                            placeholder="/inscricoes"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Descrição da CTA</Label>
                        <Textarea
                          value={pageSettings.cta_description || ''}
                          onChange={(e) => handleSettingsChange('cta_description', e.target.value)}
                          placeholder="Junte-se a centenas de profissionais..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div>
                <Label htmlFor="content_md">Conteúdo Principal (Markdown)</Label>
                <Textarea
                  id="content_md"
                  value={formData.content_md || ''}
                  onChange={(e) => handleInputChange('content_md', e.target.value)}
                  placeholder="Conteúdo em Markdown..."
                  rows={8}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este é o conteúdo principal que aparece na seção central da página
                </p>
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