
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';

const BannerManager = () => {
  const { content, updateBannerSlides } = useCMS();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    image: '/placeholder.svg',
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: ''
  });

  const handleAdd = () => {
    const newSlide = {
      id: Date.now().toString(),
      ...formData
    };
    updateBannerSlides([...content.bannerSlides, newSlide]);
    setFormData({ image: '/placeholder.svg', title: '', subtitle: '', buttonText: '', buttonLink: '' });
  };

  const handleEdit = (slide: any) => {
    setEditingId(slide.id);
    setFormData(slide);
  };

  const handleUpdate = () => {
    const updatedSlides = content.bannerSlides.map(slide =>
      slide.id === editingId ? { ...slide, ...formData } : slide
    );
    updateBannerSlides(updatedSlides);
    setEditingId(null);
    setFormData({ image: '/placeholder.svg', title: '', subtitle: '', buttonText: '', buttonLink: '' });
  };

  const handleDelete = (id: string) => {
    const filteredSlides = content.bannerSlides.filter(slide => slide.id !== id);
    updateBannerSlides(filteredSlides);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Editar Slide' : 'Adicionar Slide ao Banner'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="URL da Imagem"
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
          />
          <Input
            placeholder="Título"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <Input
            placeholder="Subtítulo"
            value={formData.subtitle}
            onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
          />
          <Input
            placeholder="Texto do Botão"
            value={formData.buttonText}
            onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
          />
          <Input
            placeholder="Link do Botão"
            value={formData.buttonLink}
            onChange={(e) => setFormData({...formData, buttonLink: e.target.value})}
          />
          <Button 
            onClick={editingId ? handleUpdate : handleAdd}
            className="bg-civeni-blue hover:bg-blue-700"
          >
            {editingId ? 'Atualizar' : 'Adicionar'} Slide
          </Button>
          {editingId && (
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingId(null);
                setFormData({ image: '/placeholder.svg', title: '', subtitle: '', buttonText: '', buttonLink: '' });
              }}
            >
              Cancelar
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {content.bannerSlides.map((slide) => (
          <Card key={slide.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{slide.title}</h3>
                  <p className="text-sm text-gray-600">{slide.subtitle}</p>
                  <p className="text-sm mt-2">Botão: {slide.buttonText} → {slide.buttonLink}</p>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(slide)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(slide.id)}>
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannerManager;
