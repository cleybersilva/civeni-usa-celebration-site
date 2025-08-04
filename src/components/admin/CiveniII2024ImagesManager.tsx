import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, GripVertical, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ImageUploadField from './ImageUploadField';
import SimpleImageUpload from './SimpleImageUpload';
import ImageGuide from './ImageGuide';

interface CiveniImage {
  id: string;
  url: string;
  alt_text_pt: string;
  alt_text_en: string;
  alt_text_es: string;
  order_index: number;
  is_active: boolean;
}

const CiveniII2024ImagesManager = () => {
  const [images, setImages] = useState<CiveniImage[]>([]);
  const [editingImage, setEditingImage] = useState<CiveniImage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const emptyImage: Omit<CiveniImage, 'id'> = {
    url: '',
    alt_text_pt: '',
    alt_text_en: '',
    alt_text_es: '',
    order_index: 1,
    is_active: true
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('civeni_ii_2024_images')
        .select('*')
        .order('order_index');

      if (error) throw error;
      
      setImages(data || []);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
      toast.error('Erro ao carregar imagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (imageData: Omit<CiveniImage, 'id'> & { id?: string }) => {
    console.log('handleSave chamado com:', imageData);
    try {
      if (imageData.id) {
        // Atualizar
        console.log('Atualizando imagem existente:', imageData.id);
        const { error } = await supabase
          .from('civeni_ii_2024_images')
          .update({
            url: imageData.url,
            alt_text_pt: imageData.alt_text_pt,
            alt_text_en: imageData.alt_text_en,
            alt_text_es: imageData.alt_text_es,
            order_index: imageData.order_index,
            is_active: imageData.is_active
          })
          .eq('id', imageData.id);

        if (error) {
          console.error('Erro ao atualizar:', error);
          throw error;
        }
        console.log('Imagem atualizada com sucesso');
        toast.success('Imagem atualizada com sucesso!');
      } else {
        // Criar
        console.log('Criando nova imagem');
        const { error } = await supabase
          .from('civeni_ii_2024_images')
          .insert({
            url: imageData.url,
            alt_text_pt: imageData.alt_text_pt,
            alt_text_en: imageData.alt_text_en,
            alt_text_es: imageData.alt_text_es,
            order_index: imageData.order_index,
            is_active: imageData.is_active
          });

        if (error) {
          console.error('Erro ao inserir:', error);
          throw error;
        }
        console.log('Imagem criada com sucesso');
        toast.success('Imagem criada com sucesso!');
      }

      setEditingImage(null);
      setIsCreating(false);
      console.log('Recarregando lista de imagens...');
      await fetchImages();
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      toast.error('Erro ao salvar imagem');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    try {
      const { error } = await supabase
        .from('civeni_ii_2024_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Imagem excluída com sucesso!');
      await fetchImages();
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      toast.error('Erro ao excluir imagem');
    }
  };

  const reorderImages = async (dragIndex: number, hoverIndex: number) => {
    const draggedImage = images[dragIndex];
    const newImages = [...images];
    newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, draggedImage);

    // Atualizar order_index
    const updates = newImages.map((img, index) => ({
      id: img.id,
      order_index: index + 1
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('civeni_ii_2024_images')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }
      
      setImages(newImages);
      toast.success('Ordem das imagens atualizada!');
    } catch (error) {
      console.error('Erro ao reordenar imagens:', error);
      toast.error('Erro ao reordenar imagens');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-civeni-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">II CIVENI 2024 - Imagens</h2>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-civeni-blue hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Imagem
        </Button>
      </div>

      {/* Formulário de criação/edição */}
      {(isCreating || editingImage) && (
        <ImageForm
          image={editingImage || emptyImage}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false);
            setEditingImage(null);
          }}
        />
      )}

      {/* Lista de imagens */}
      <div className="grid gap-4">
        {images.map((image, index) => (
          <Card key={image.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="cursor-move">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                
                <img
                  src={image.url}
                  alt={image.alt_text_pt}
                  className="w-16 h-16 object-cover rounded"
                />
                
                <div className="flex-1">
                  <h3 className="font-semibold">{image.alt_text_pt}</h3>
                  <p className="text-sm text-gray-600">Ordem: {image.order_index}</p>
                  <p className="text-sm text-gray-600">
                    Status: {image.is_active ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setEditingImage(image)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(image.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4" />
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

interface ImageFormProps {
  image: Omit<CiveniImage, 'id'> & { id?: string };
  onSave: (image: Omit<CiveniImage, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

const ImageForm: React.FC<ImageFormProps> = ({ image, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    ...image,
    uploadedImage: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit chamado com formData:', formData);
    
    // Usar imagem uploadada se disponível, senão usar URL
    const finalImageUrl = formData.uploadedImage || formData.url;
    console.log('finalImageUrl:', finalImageUrl);
    
    if (!finalImageUrl || !formData.alt_text_pt) {
      console.log('Validação falhou:', { finalImageUrl, alt_text_pt: formData.alt_text_pt });
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const dataToSave = {
      ...formData,
      url: finalImageUrl
    };
    console.log('Chamando onSave com:', dataToSave);
    onSave(dataToSave);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {image.id ? 'Editar Imagem' : 'Nova Imagem'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <SimpleImageUpload
                  label="Imagem (Upload)"
                  value={formData.uploadedImage}
                  onChange={(value) => setFormData({...formData, uploadedImage: value})}
                />
              </div>
              
              <div>
                <Label htmlFor="url">URL da Imagem (Opcional se fez upload)</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="Cole aqui a URL da imagem ou faça upload acima"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="alt_text_pt">Descrição (Português) *</Label>
                  <Textarea
                    id="alt_text_pt"
                    value={formData.alt_text_pt}
                    onChange={(e) => setFormData({ ...formData, alt_text_pt: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="alt_text_en">Descrição (Inglês) *</Label>
                  <Textarea
                    id="alt_text_en"
                    value={formData.alt_text_en}
                    onChange={(e) => setFormData({ ...formData, alt_text_en: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="alt_text_es">Descrição (Espanhol) *</Label>
                  <Textarea
                    id="alt_text_es"
                    value={formData.alt_text_es}
                    onChange={(e) => setFormData({ ...formData, alt_text_es: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order_index">Ordem de Exibição</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <ImageGuide type="banner" title="Imagens do II CIVENI 2024" />
      </div>
    </div>
  );
};

export default CiveniII2024ImagesManager;