
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCMS, BannerSlide } from '@/contexts/CMSContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageGuide from './ImageGuide';
import SimpleImageUpload from './SimpleImageUpload';

const BannerManager = () => {
  const { content, updateBannerSlides } = useCMS();
  const { user } = useAdminAuth();
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Forçar recarga dos dados em modo admin quando o componente carrega
  useEffect(() => {
    const loadAdminContent = async () => {
      try {
        // Força recarregamento dos banners incluindo inativos
        const { data: allBanners } = await supabase
          .from('banner_slides')
          .select('*')
          .order('order_index', { ascending: true });
        
        console.log('Loaded banners for admin:', allBanners);
      } catch (error) {
        console.error('Erro ao carregar dados do admin:', error);
      }
    };
    loadAdminContent();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    titleEs: '',
    titleTr: '',
    subtitle: '',
    subtitleEn: '',
    subtitleEs: '',
    subtitleTr: '',
    description: '',
    descriptionEn: '',
    descriptionEs: '',
    descriptionTr: '',
    bgImage: '',
    uploadedImage: '',
    buttonText: '',
    buttonTextEn: '',
    buttonTextEs: '',
    buttonTextTr: '',
    buttonLink: '',
    order: 1
  });

  const resetForm = () => {
    setFormData({
      title: '',
      titleEn: '',
      titleEs: '',
      titleTr: '',
      subtitle: '',
      subtitleEn: '',
      subtitleEs: '',
      subtitleTr: '',
      description: '',
      descriptionEn: '',
      descriptionEs: '',
      descriptionTr: '',
      bgImage: '',
      uploadedImage: '',
      buttonText: '',
      buttonTextEn: '',
      buttonTextEs: '',
      buttonTextTr: '',
      buttonLink: '',
      order: content.bannerSlides.length + 1
    });
    setEditingSlide(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.email) {
      toast.error('Usuário não autenticado. Faça login novamente.');
      return;
    }
    
    try {
      // Use uploaded image if available, otherwise use URL
      const finalBgImage = formData.uploadedImage || formData.bgImage;
      
      console.log('Dados do formulário:', formData);
      console.log('Imagem final selecionada:', finalBgImage);
      
      // Validate required fields
      if (!formData.title || !formData.subtitle || !formData.description) {
        toast.error('Por favor, preencha todos os campos obrigatórios (título, subtítulo e descrição).');
        return;
      }
      
      // Validate that at least one image source is provided
      if (!finalBgImage) {
        toast.error('Por favor, faça upload de uma imagem ou forneça uma URL para a imagem de fundo.');
        return;
      }
      
      const slides = [...content.bannerSlides];
      
      if (editingSlide) {
        const index = slides.findIndex(s => s.id === editingSlide.id);
        if (index !== -1) {
          slides[index] = {
            ...editingSlide,
            ...formData,
            bgImage: finalBgImage,
            order: editingSlide.order // Manter ordem original
          };
        }
      } else {
        const newSlide: BannerSlide = {
          id: 'new', // Será tratado no contexto CMS para gerar UUID no Supabase
          ...formData,
          bgImage: finalBgImage,
          order: formData.order
        };
        slides.push(newSlide);
      }

      await updateBannerSlides(slides);
      setIsDialogOpen(false);
      resetForm();
      
      toast.success('Banner atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      toast.error('Erro ao salvar banner. Tente novamente.');
    }
  };

  const handleEdit = (slide: BannerSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      titleEn: slide.titleEn || '',
      titleEs: slide.titleEs || '',
      titleTr: slide.titleTr || '',
      subtitle: slide.subtitle,
      subtitleEn: slide.subtitleEn || '',
      subtitleEs: slide.subtitleEs || '',
      subtitleTr: slide.subtitleTr || '',
      description: slide.description,
      descriptionEn: slide.descriptionEn || '',
      descriptionEs: slide.descriptionEs || '',
      descriptionTr: slide.descriptionTr || '',
      bgImage: slide.bgImage,
      uploadedImage: '', // Limpar upload quando editar
      buttonText: slide.buttonText,
      buttonTextEn: slide.buttonTextEn || '',
      buttonTextEs: slide.buttonTextEs || '',
      buttonTextTr: slide.buttonTextTr || '',
      buttonLink: slide.buttonLink,
      order: slide.order
    });
    setIsDialogOpen(true);
    
    console.log('Iniciando edição do slide:', slide);
  };

  const handleDelete = async (slideId: string) => {
    if (!confirm('Tem certeza que deseja excluir este slide?')) {
      return;
    }
    
    try {
      const slides = content.bannerSlides.filter(s => s.id !== slideId);
      await updateBannerSlides(slides);
      toast.success('Banner excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir banner:', error);
      toast.error('Erro ao excluir banner. Tente novamente.');
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-civeni-blue">Gerenciar Banner Principal</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600 w-full sm:w-auto text-sm sm:text-base">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Adicionar Slide</span>
              <span className="sm:hidden">Novo Slide</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Editar Slide' : 'Adicionar Slide'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Seção Português */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-civeni-blue border-b pb-2">🇧🇷 Português</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Título (PT)</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                        placeholder="Título em português"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subtítulo (PT)</label>
                      <Input
                        value={formData.subtitle}
                        onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                        required
                        placeholder="Subtítulo em português"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição (PT)</label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={2}
                        required
                        placeholder="Descrição em português"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto do Botão (PT)</label>
                      <Input
                        value={formData.buttonText}
                        onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                        placeholder="Ex: Inscreva-se agora"
                      />
                    </div>
                  </div>

                  {/* Seção Inglês */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-civeni-blue border-b pb-2">🇺🇸 English</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Título (EN)</label>
                      <Input
                        value={formData.titleEn}
                        onChange={(e) => setFormData({...formData, titleEn: e.target.value})}
                        placeholder="Title in English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subtítulo (EN)</label>
                      <Input
                        value={formData.subtitleEn}
                        onChange={(e) => setFormData({...formData, subtitleEn: e.target.value})}
                        placeholder="Subtitle in English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição (EN)</label>
                      <Textarea
                        value={formData.descriptionEn}
                        onChange={(e) => setFormData({...formData, descriptionEn: e.target.value})}
                        rows={2}
                        placeholder="Description in English"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto do Botão (EN)</label>
                      <Input
                        value={formData.buttonTextEn}
                        onChange={(e) => setFormData({...formData, buttonTextEn: e.target.value})}
                        placeholder="Ex: Register now"
                      />
                    </div>
                  </div>

                  {/* Seção Espanhol */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-civeni-blue border-b pb-2">🇪🇸 Español</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Título (ES)</label>
                      <Input
                        value={formData.titleEs}
                        onChange={(e) => setFormData({...formData, titleEs: e.target.value})}
                        placeholder="Título en español"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subtítulo (ES)</label>
                      <Input
                        value={formData.subtitleEs}
                        onChange={(e) => setFormData({...formData, subtitleEs: e.target.value})}
                        placeholder="Subtítulo en español"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição (ES)</label>
                      <Textarea
                        value={formData.descriptionEs}
                        onChange={(e) => setFormData({...formData, descriptionEs: e.target.value})}
                        rows={2}
                        placeholder="Descripción en español"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto do Botão (ES)</label>
                      <Input
                        value={formData.buttonTextEs}
                        onChange={(e) => setFormData({...formData, buttonTextEs: e.target.value})}
                        placeholder="Ej: Inscríbete ahora"
                      />
                    </div>
                  </div>

                  {/* Seção Turco */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-civeni-blue border-b pb-2">🇹🇷 Türkçe</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Título (TR)</label>
                      <Input
                        value={formData.titleTr}
                        onChange={(e) => setFormData({...formData, titleTr: e.target.value})}
                        placeholder="Türkçe başlık"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subtítulo (TR)</label>
                      <Input
                        value={formData.subtitleTr}
                        onChange={(e) => setFormData({...formData, subtitleTr: e.target.value})}
                        placeholder="Türkçe alt başlık"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Descrição (TR)</label>
                      <Textarea
                        value={formData.descriptionTr}
                        onChange={(e) => setFormData({...formData, descriptionTr: e.target.value})}
                        rows={2}
                        placeholder="Türkçe açıklama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto do Botão (TR)</label>
                      <Input
                        value={formData.buttonTextTr}
                        onChange={(e) => setFormData({...formData, buttonTextTr: e.target.value})}
                        placeholder="Örnek: Şimdi kaydol"
                      />
                    </div>
                  </div>
                  <div>
                     <SimpleImageUpload
                      label="Imagem de Fundo (Upload)"
                      value={formData.uploadedImage}
                      onChange={(value) => setFormData({...formData, uploadedImage: value, bgImage: ''})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL da Imagem de Fundo (Opcional se fez upload)</label>
                    <Input
                      type="url"
                      value={formData.bgImage}
                      onChange={(e) => setFormData({...formData, bgImage: e.target.value})}
                      placeholder="Cole aqui a URL da imagem ou faça upload acima"
                    />
                  </div>
                  {/* Configurações Gerais */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-civeni-blue">⚙️ Configurações Gerais</h3>
                    <div>
                      <label className="block text-sm font-medium mb-2">Link do Botão</label>
                      <Input
                        value={formData.buttonLink}
                        onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
                        placeholder="URL de destino do botão (ex: #inscricoes)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Ordem de Exibição</label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.order}
                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 1})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                      {editingSlide ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </div>
              
              <div>
                <ImageGuide type="banner" title="Banner" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {content.bannerSlides.sort((a, b) => a.order - b.order).map((slide) => (
          <Card key={slide.id} className={`${!slide.id || slide.id === 'new' ? 'opacity-50' : ''}`}>
            <CardHeader>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback para erro de imagem
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                    <p className="text-sm">{slide.subtitle}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Ordem:</strong> {slide.order}</p>
                <p><strong>Descrição:</strong> {slide.description}</p>
                <p><strong>Botão:</strong> {slide.buttonText ? `${slide.buttonText} → ${slide.buttonLink}` : 'Sem botão'}</p>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(slide)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(slide.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannerManager;
