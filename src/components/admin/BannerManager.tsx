
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCMS, BannerSlide } from '@/contexts/CMSContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ImageGuide from './ImageGuide';
import SimpleImageUpload from './SimpleImageUpload';

const BannerManager = () => {
  const { content, updateBannerSlides } = useCMS();
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    bgImage: '',
    uploadedImage: '',
    buttonText: '',
    buttonLink: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      bgImage: '',
      uploadedImage: '',
      buttonText: '',
      buttonLink: ''
    });
    setEditingSlide(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use uploaded image if available, otherwise use URL
      const finalBgImage = formData.uploadedImage || formData.bgImage;
      
      // Validate that at least one image source is provided
      if (!finalBgImage) {
        alert('Por favor, faça upload de uma imagem ou forneça uma URL para a imagem de fundo.');
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
          order: slides.length + 1
        };
        slides.push(newSlide);
      }

      await updateBannerSlides(slides);
      setIsDialogOpen(false);
      resetForm();
      
      alert('Banner atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      alert('Erro ao salvar banner. Tente novamente.');
    }
  };

  const handleEdit = (slide: BannerSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      bgImage: slide.bgImage,
      uploadedImage: '',
      buttonText: slide.buttonText,
      buttonLink: slide.buttonLink
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (slideId: string) => {
    if (confirm('Tem certeza que deseja excluir este slide?')) {
      try {
        const slides = content.bannerSlides.filter(s => s.id !== slideId);
        await updateBannerSlides(slides);
        alert('Banner excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir banner:', error);
        alert('Erro ao excluir banner. Tente novamente.');
      }
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
                      onChange={(value) => setFormData({...formData, uploadedImage: value})}
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
                  <div>
                    <label className="block text-sm font-medium mb-2">Texto do Botão</label>
                    <Input
                      value={formData.buttonText}
                      onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Link do Botão</label>
                    <Input
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
                      required
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
        {content.bannerSlides.map((slide) => (
          <Card key={slide.id}>
            <CardHeader>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="w-full h-full object-cover"
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
                <p><strong>Descrição:</strong> {slide.description}</p>
                <p><strong>Botão:</strong> {slide.buttonText} → {slide.buttonLink}</p>
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
