import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Save, Eye, Globe } from 'lucide-react';
import SimpleImageUpload from './SimpleImageUpload';

interface CongressoApresentacaoData {
  id?: string;
  titulo_pt: string;
  titulo_en: string;
  titulo_es: string;
  descricao_pt: string;
  descricao_en: string;
  descricao_es: string;
  tema_pt: string;
  tema_en: string;
  tema_es: string;
  video_url: string;
  imagem_destaque: string;
}

const CongressoApresentacaoManager = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pt');
  const [formData, setFormData] = useState<CongressoApresentacaoData>({
    titulo_pt: '',
    titulo_en: '',
    titulo_es: '',
    descricao_pt: '',
    descricao_en: '',
    descricao_es: '',
    tema_pt: '',
    tema_en: '',
    tema_es: '',
    video_url: '',
    imagem_destaque: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('congresso_apresentacao')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching data:', error);
        return;
      }

      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (formData.id) {
        // Update existing record
        const { error } = await supabase
          .from('congresso_apresentacao')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('congresso_apresentacao')
          .insert([formData]);

        if (error) throw error;
      }

      toast.success(t('admin.congress.presentation.save_success', 'Apresentação salva com sucesso!'));
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error(t('admin.congress.presentation.save_error', 'Erro ao salvar apresentação'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CongressoApresentacaoData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({
      ...prev,
      imagem_destaque: url
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t('admin.congress.presentation.title', 'Gerenciar Apresentação')}
          </h2>
          <p className="text-muted-foreground">
            {t('admin.congress.presentation.description', 'Configure o conteúdo da página de apresentação do congresso')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            asChild
            className="flex items-center gap-2"
          >
            <a href="/congresso/apresentacao" target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" />
              {t('admin.preview', 'Visualizar')}
            </a>
          </Button>
          
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('admin.multilingual_content', 'Conteúdo Multilíngue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pt">Português</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Español</TabsTrigger>
            </TabsList>

            <TabsContent value="pt" className="space-y-6 mt-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="titulo_pt">Título (Português)</Label>
                  <Input
                    id="titulo_pt"
                    value={formData.titulo_pt}
                    onChange={(e) => handleInputChange('titulo_pt', e.target.value)}
                    placeholder="Título do congresso em português"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tema_pt">Tema (Português)</Label>
                  <Input
                    id="tema_pt"
                    value={formData.tema_pt}
                    onChange={(e) => handleInputChange('tema_pt', e.target.value)}
                    placeholder="Tema principal do congresso"
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao_pt">Descrição (Português)</Label>
                  <Textarea
                    id="descricao_pt"
                    value={formData.descricao_pt}
                    onChange={(e) => handleInputChange('descricao_pt', e.target.value)}
                    placeholder="Descrição detalhada do congresso"
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-6 mt-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="titulo_en">Title (English)</Label>
                  <Input
                    id="titulo_en"
                    value={formData.titulo_en}
                    onChange={(e) => handleInputChange('titulo_en', e.target.value)}
                    placeholder="Congress title in English"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tema_en">Theme (English)</Label>
                  <Input
                    id="tema_en"
                    value={formData.tema_en}
                    onChange={(e) => handleInputChange('tema_en', e.target.value)}
                    placeholder="Main theme of the congress"
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao_en">Description (English)</Label>
                  <Textarea
                    id="descricao_en"
                    value={formData.descricao_en}
                    onChange={(e) => handleInputChange('descricao_en', e.target.value)}
                    placeholder="Detailed description of the congress"
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="es" className="space-y-6 mt-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="titulo_es">Título (Español)</Label>
                  <Input
                    id="titulo_es"
                    value={formData.titulo_es}
                    onChange={(e) => handleInputChange('titulo_es', e.target.value)}
                    placeholder="Título del congreso en español"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tema_es">Tema (Español)</Label>
                  <Input
                    id="tema_es"
                    value={formData.tema_es}
                    onChange={(e) => handleInputChange('tema_es', e.target.value)}
                    placeholder="Tema principal del congreso"
                  />
                </div>
                
                <div>
                  <Label htmlFor="descricao_es">Descripción (Español)</Label>
                  <Textarea
                    id="descricao_es"
                    value={formData.descricao_es}
                    onChange={(e) => handleInputChange('descricao_es', e.target.value)}
                    placeholder="Descripción detallada del congreso"
                    rows={6}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mídia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="video_url">URL do Vídeo (YouTube/Vimeo)</Label>
              <Input
                id="video_url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            
            <div>
              <Label>Imagem de Destaque</Label>
              <SimpleImageUpload
                value={formData.imagem_destaque}
                onChange={handleImageUpload}
                label="Imagem de Destaque"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{formData.titulo_pt}</h3>
                <p className="text-primary font-medium">{formData.tema_pt}</p>
              </div>
              
              {formData.imagem_destaque && (
                <img
                  src={formData.imagem_destaque}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              
              <p className="text-sm text-muted-foreground line-clamp-3">
                {formData.descricao_pt}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CongressoApresentacaoManager;