import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X, Upload, Link, FileText, Image, Video } from 'lucide-react';

interface WorkContent {
  id: string;
  work_type: string;
  content_type: string;
  title_pt?: string;
  title_en?: string;
  title_es?: string;
  content_pt?: string;
  content_en?: string;
  content_es?: string;
  file_url?: string;
  file_name?: string;
  link_url?: string;
  order_index: number;
  is_active: boolean;
}

interface WorkContentManagerProps {
  workType: 'apresentacao-oral' | 'sessoes-poster' | 'manuscritos';
  title: string;
}

const WorkContentManager: React.FC<WorkContentManagerProps> = ({ workType, title }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState<WorkContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkContent | null>(null);
  const [formData, setFormData] = useState({
    content_type: 'text',
    title_pt: '',
    title_en: '',
    title_es: '',
    content_pt: '',
    content_en: '',
    content_es: '',
    file_url: '',
    file_name: '',
    link_url: '',
    order_index: 1,
    is_active: true
  });

  useEffect(() => {
    fetchContent();
  }, [workType]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('work_content')
        .select('*')
        .eq('work_type', workType)
        .order('order_index');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Erro ao carregar conteúdo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        work_type: workType
      };

      if (editingItem) {
        const { error } = await supabase
          .from('work_content')
          .update(dataToSave)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Conteúdo atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('work_content')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Conteúdo criado com sucesso');
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchContent();
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Erro ao salvar conteúdo');
    }
  };

  const handleEdit = (item: WorkContent) => {
    setEditingItem(item);
    setFormData({
      content_type: item.content_type,
      title_pt: item.title_pt || '',
      title_en: item.title_en || '',
      title_es: item.title_es || '',
      content_pt: item.content_pt || '',
      content_en: item.content_en || '',
      content_es: item.content_es || '',
      file_url: item.file_url || '',
      file_name: item.file_name || '',
      link_url: item.link_url || '',
      order_index: item.order_index,
      is_active: item.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from('work_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Conteúdo excluído com sucesso');
      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Erro ao excluir conteúdo');
    }
  };

  const resetForm = () => {
    setFormData({
      content_type: 'text',
      title_pt: '',
      title_en: '',
      title_es: '',
      content_pt: '',
      content_en: '',
      content_es: '',
      file_url: '',
      file_name: '',
      link_url: '',
      order_index: content.length + 1,
      is_active: true
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'file': return <Upload className="h-4 w-4" />;
      case 'link': return <Link className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Carregando...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingItem(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Conteúdo' : 'Adicionar Conteúdo'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <Select value={formData.content_type} onValueChange={(value) => setFormData({...formData, content_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="file">Arquivo</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label>Ativo</Label>
              </div>

              <Tabs defaultValue="pt" className="w-full">
                <TabsList>
                  <TabsTrigger value="pt">Português</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="es">Español</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pt" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título (PT)</Label>
                    <Input
                      value={formData.title_pt}
                      onChange={(e) => setFormData({...formData, title_pt: e.target.value})}
                    />
                  </div>
                  {(formData.content_type === 'text' || formData.content_type === 'image') && (
                    <div className="space-y-2">
                      <Label>Conteúdo (PT)</Label>
                      <Textarea
                        rows={6}
                        value={formData.content_pt}
                        onChange={(e) => setFormData({...formData, content_pt: e.target.value})}
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="en" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título (EN)</Label>
                    <Input
                      value={formData.title_en}
                      onChange={(e) => setFormData({...formData, title_en: e.target.value})}
                    />
                  </div>
                  {(formData.content_type === 'text' || formData.content_type === 'image') && (
                    <div className="space-y-2">
                      <Label>Conteúdo (EN)</Label>
                      <Textarea
                        rows={6}
                        value={formData.content_en}
                        onChange={(e) => setFormData({...formData, content_en: e.target.value})}
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="es" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Título (ES)</Label>
                    <Input
                      value={formData.title_es}
                      onChange={(e) => setFormData({...formData, title_es: e.target.value})}
                    />
                  </div>
                  {(formData.content_type === 'text' || formData.content_type === 'image') && (
                    <div className="space-y-2">
                      <Label>Conteúdo (ES)</Label>
                      <Textarea
                        rows={6}
                        value={formData.content_es}
                        onChange={(e) => setFormData({...formData, content_es: e.target.value})}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {(formData.content_type === 'file' || formData.content_type === 'image' || formData.content_type === 'video') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL do Arquivo</Label>
                    <Input
                      value={formData.file_url}
                      onChange={(e) => setFormData({...formData, file_url: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Arquivo</Label>
                    <Input
                      value={formData.file_name}
                      onChange={(e) => setFormData({...formData, file_name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {formData.content_type === 'link' && (
                <div className="space-y-2">
                  <Label>URL do Link</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {content.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum conteúdo cadastrado
          </p>
        ) : (
          <div className="space-y-4">
            {content.map((item) => (
              <Card key={item.id} className={`${!item.is_active ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getContentTypeIcon(item.content_type)}
                      <div>
                        <h4 className="font-medium">
                          {item.title_pt || item.file_name || 'Sem título'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {item.content_type} - Ordem: {item.order_index}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkContentManager;