
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
    subtitle: '',
    description: '',
    bgImage: '',
    uploadedImage: '',
    buttonText: '',
    buttonLink: '',
    order: 1
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      bgImage: '',
      uploadedImage: '',
      buttonText: '',
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
      subtitle: slide.subtitle,
      description: slide.description,
      bgImage: slide.bgImage,
      uploadedImage: '', // Limpar upload quando editar
      buttonText: slide.buttonText,
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Banner Principal</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Slide
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Título</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subtítulo</label>
                    <Input
                      value={formData.subtitle}
                      onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Descrição</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={2}
                      required
                    />
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Texto do Botão (Opcional)</label>
                      <Input
                        value={formData.buttonText}
                        onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                        placeholder="Texto do botão de ação"
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Link do Botão (Opcional)</label>
                    <Input
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
                      placeholder="URL de destino do botão"
                    />
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
