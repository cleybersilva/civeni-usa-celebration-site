import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEventCategories } from '@/hooks/useEventCategories';
import { toast } from 'sonner';

interface CategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: any;
}

export const CategoryFormDialog: React.FC<CategoryFormDialogProps> = ({
  isOpen,
  onClose,
  category
}) => {
  const { createCategory, updateCategory } = useEventCategories();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title_pt: '',
    title_en: '',
    title_es: '',
    title_tr: '',
    description_pt: '',
    description_en: '',
    description_es: '',
    description_tr: '',
    slug: '',
    order_index: 1,
    is_active: true,
    is_free: false,
    currency: 'BRL',
    price_cents: 0,
    quota_total: null as number | null,
    available_from: null as Date | null,
    available_until: null as Date | null,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        title_pt: category.title_pt || '',
        title_en: category.title_en || '',
        title_es: category.title_es || '',
        title_tr: category.title_tr || '',
        description_pt: category.description_pt || '',
        description_en: category.description_en || '',
        description_es: category.description_es || '',
        description_tr: category.description_tr || '',
        slug: category.slug || '',
        order_index: category.order_index || 1,
        is_active: category.is_active ?? true,
        is_free: category.is_free ?? false,
        currency: category.currency || 'BRL',
        price_cents: category.price_cents || 0,
        quota_total: category.quota_total,
        available_from: category.available_from ? new Date(category.available_from) : null,
        available_until: category.available_until ? new Date(category.available_until) : null,
      });
    } else {
      setFormData({
        title_pt: '',
        title_en: '',
        title_es: '',
        title_tr: '',
        description_pt: '',
        description_en: '',
        description_es: '',
        description_tr: '',
        slug: '',
        order_index: 1,
        is_active: true,
        is_free: false,
        currency: 'BRL',
        price_cents: 0,
        quota_total: null,
        available_from: null,
        available_until: null,
      });
    }
  }, [category, isOpen]);

  // Generate slug from title_pt
  useEffect(() => {
    if (formData.title_pt && !category) {
      const slug = formData.title_pt
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title_pt, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.title_pt.trim()) {
        toast.error('Título em português é obrigatório');
        return;
      }

      if (!formData.slug.trim()) {
        toast.error('Slug é obrigatório');
        return;
      }

      if (!formData.is_free && formData.price_cents <= 0) {
        toast.error('Preço deve ser maior que zero para categorias pagas');
        return;
      }

      const categoryData = {
        ...formData,
        event_id: category?.event_id || 'default-event-id', // You may want to get this from context
        available_from: formData.available_from?.toISOString() || null,
        available_until: formData.available_until?.toISOString() || null,
        stripe_product_id: category?.stripe_product_id || null,
        stripe_price_id: category?.stripe_price_id || null,
        lot_id: category?.lot_id || null,
      };

      let result;
      if (category) {
        result = await updateCategory(category.id, categoryData);
      } else {
        result = await createCategory(categoryData);
      }

      if (result.success) {
        toast.success(category ? 'Categoria atualizada' : 'Categoria criada');
        onClose();
      } else {
        toast.error('Erro ao salvar categoria');
      }
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="pt" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pt">Português</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="es">Español</TabsTrigger>
              <TabsTrigger value="tr">Türkçe</TabsTrigger>
            </TabsList>

            <TabsContent value="pt" className="space-y-4">
              <div>
                <Label htmlFor="title_pt">Título (PT) *</Label>
                <Input
                  id="title_pt"
                  value={formData.title_pt}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_pt: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description_pt">Descrição (PT)</Label>
                <Textarea
                  id="description_pt"
                  value={formData.description_pt}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_pt: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <div>
                <Label htmlFor="title_en">Title (EN)</Label>
                <Input
                  id="title_en"
                  value={formData.title_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description_en">Description (EN)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="es" className="space-y-4">
              <div>
                <Label htmlFor="title_es">Título (ES)</Label>
                <Input
                  id="title_es"
                  value={formData.title_es}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_es: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description_es">Descripción (ES)</Label>
                <Textarea
                  id="description_es"
                  value={formData.description_es}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_es: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="tr" className="space-y-4">
              <div>
                <Label htmlFor="title_tr">Başlık (TR)</Label>
                <Input
                  id="title_tr"
                  value={formData.title_tr}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_tr: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description_tr">Açıklama (TR)</Label>
                <Textarea
                  id="description_tr"
                  value={formData.description_tr}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_tr: e.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="order_index">Ordem</Label>
              <Input
                id="order_index"
                type="number"
                min="1"
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Categoria Ativa</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_free: checked, price_cents: checked ? 0 : prev.price_cents }))}
              />
              <Label htmlFor="is_free">Gratuito</Label>
            </div>
          </div>

          {!formData.is_free && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_cents">Preço (centavos)</Label>
                <Input
                  id="price_cents"
                  type="number"
                  min="0"
                  value={formData.price_cents}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_cents: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Valor em centavos (ex: 10000 = R$ 100,00)
                </p>
              </div>
              <div>
                <Label htmlFor="quota_total">Cota Total (opcional)</Label>
                <Input
                  id="quota_total"
                  type="number"
                  min="1"
                  value={formData.quota_total || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quota_total: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Disponível a partir de</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.available_from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.available_from ? format(formData.available_from, "PPP") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.available_from}
                    onSelect={(date) => setFormData(prev => ({ ...prev, available_from: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Disponível até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.available_until && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.available_until ? format(formData.available_until, "PPP") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.available_until}
                    onSelect={(date) => setFormData(prev => ({ ...prev, available_until: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (category ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};