import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, BookOpen, Heart, Scale, Users, Globe, Laptop } from 'lucide-react';
import { useThematicAreas } from '@/hooks/useThematicAreas';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ThematicAreaForm {
  name_pt: string;
  name_en: string;
  name_es: string;
  name_tr: string;
  description_pt: string;
  description_en: string;
  description_es: string;
  description_tr: string;
  icon_name: string;
  color_class: string;
  order_index: number;
  is_active: boolean;
}

const initialForm: ThematicAreaForm = {
  name_pt: '',
  name_en: '',
  name_es: '',
  name_tr: '',
  description_pt: '',
  description_en: '',
  description_es: '',
  description_tr: '',
  icon_name: 'BookOpen',
  color_class: 'civeni-blue',
  order_index: 1,
  is_active: true
};

const iconOptions = [
  { value: 'BookOpen', label: 'Livro', icon: BookOpen },
  { value: 'Heart', label: 'Coração', icon: Heart },
  { value: 'Scale', label: 'Balança', icon: Scale },
  { value: 'Users', label: 'Usuários', icon: Users },
  { value: 'Globe', label: 'Globo', icon: Globe },
  { value: 'Laptop', label: 'Laptop', icon: Laptop }
];

const ThematicAreasManager = () => {
  const { thematicAreas, isLoading } = useThematicAreas();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [form, setForm] = useState<ThematicAreaForm>(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingArea) {
        // Update existing area
        const { error } = await supabase
          .from('thematic_areas')
          .update(form)
          .eq('id', editingArea);
          
        if (error) throw error;
        
        toast({
          title: 'Área temática atualizada',
          description: 'A área temática foi atualizada com sucesso.',
        });
      } else {
        // Create new area
        const { error } = await supabase
          .from('thematic_areas')
          .insert([form]);
          
        if (error) throw error;
        
        toast({
          title: 'Área temática criada',
          description: 'A nova área temática foi criada com sucesso.',
        });
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['thematic-areas'] });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setEditingArea(null);
      setForm(initialForm);
      
    } catch (error) {
      console.error('Error saving thematic area:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a área temática.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (area: any) => {
    setForm({
      name_pt: area.name_pt || '',
      name_en: area.name_en || '',
      name_es: area.name_es || '',
      name_tr: area.name_tr || '',
      description_pt: area.description_pt || '',
      description_en: area.description_en || '',
      description_es: area.description_es || '',
      description_tr: area.description_tr || '',
      icon_name: area.icon_name || 'BookOpen',
      color_class: area.color_class || 'civeni-blue',
      order_index: area.order_index || 1,
      is_active: area.is_active ?? true
    });
    setEditingArea(area.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta área temática?')) return;
    
    try {
      const { error } = await supabase
        .from('thematic_areas')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Área temática excluída',
        description: 'A área temática foi excluída com sucesso.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['thematic-areas'] });
      
    } catch (error) {
      console.error('Error deleting thematic area:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir a área temática.',
        variant: 'destructive',
      });
    }
  };

  const openCreateDialog = () => {
    setForm(initialForm);
    setEditingArea(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando áreas temáticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Áreas Temáticas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as áreas temáticas do evento
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Área Temática
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArea ? 'Editar Área Temática' : 'Nova Área Temática'}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da área temática nos diferentes idiomas
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={form.icon_name} onValueChange={(value) => setForm({...form, icon_name: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={form.order_index}
                    onChange={(e) => setForm({...form, order_index: parseInt(e.target.value) || 1})}
                    min="1"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({...form, is_active: checked})}
                    />
                    <span>{form.is_active ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
              </div>

              {/* Multilingual Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Portuguese */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Português</h3>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      value={form.name_pt}
                      onChange={(e) => setForm({...form, name_pt: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Textarea
                      value={form.description_pt}
                      onChange={(e) => setForm({...form, description_pt: e.target.value})}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* English */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">English</h3>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name_en}
                      onChange={(e) => setForm({...form, name_en: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={form.description_en}
                      onChange={(e) => setForm({...form, description_en: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Spanish */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Español</h3>
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={form.name_es}
                      onChange={(e) => setForm({...form, name_es: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={form.description_es}
                      onChange={(e) => setForm({...form, description_es: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Turkish */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Türkçe</h3>
                  <div className="space-y-2">
                    <Label>İsim</Label>
                    <Input
                      value={form.name_tr}
                      onChange={(e) => setForm({...form, name_tr: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Açıklama</Label>
                    <Textarea
                      value={form.description_tr}
                      onChange={(e) => setForm({...form, description_tr: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingArea ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {thematicAreas?.map((area) => {
          const IconComponent = iconOptions.find(opt => opt.value === area.icon_name)?.icon || BookOpen;
          
          return (
            <Card key={area.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 bg-${area.color_class || 'civeni-blue'} rounded-full`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {area.name_pt}
                        {!area.is_active && <Badge variant="secondary">Inativo</Badge>}
                      </CardTitle>
                      <CardDescription>
                        Ordem: {area.order_index}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(area)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(area.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{area.description_pt}</p>
                {(area.name_en || area.name_es || area.name_tr) && (
                  <div className="mt-4 space-y-2">
                    {area.name_en && <div><strong>EN:</strong> {area.name_en}</div>}
                    {area.name_es && <div><strong>ES:</strong> {area.name_es}</div>}
                    {area.name_tr && <div><strong>TR:</strong> {area.name_tr}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ThematicAreasManager;