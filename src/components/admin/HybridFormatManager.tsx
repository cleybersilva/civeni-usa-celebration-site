import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SimpleImageUpload from './SimpleImageUpload';

interface HybridActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
}

const HybridFormatManager = () => {
  const [activities, setActivities] = useState<HybridActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('hybrid_format_config')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar configurações do formato híbrido');
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleSave = async (activity: HybridActivity) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('hybrid_format_config')
        .upsert({
          id: activity.id,
          activity_type: activity.activity_type,
          title: activity.title,
          description: activity.description,
          image_url: activity.image_url,
          order_index: activity.order_index,
          is_active: activity.is_active,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success('Atividade atualizada com sucesso!');
      await loadActivities();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar atividade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta atividade?')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('hybrid_format_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Atividade excluída com sucesso!');
      await loadActivities();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir atividade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = async () => {
    const newActivity = {
      activity_type: 'custom',
      title: 'Nova Atividade',
      description: 'Descrição da nova atividade',
      image_url: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=600&q=80',
      order_index: activities.length + 1,
      is_active: true
    };

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('hybrid_format_config')
        .insert(newActivity);

      if (error) throw error;
      
      toast.success('Nova atividade adicionada!');
      await loadActivities();
    } catch (error) {
      console.error('Erro ao adicionar:', error);
      toast.error('Erro ao adicionar nova atividade');
    } finally {
      setIsLoading(false);
    }
  };

  const updateActivity = (id: string, field: string, value: any) => {
    setActivities(prev => prev.map(activity => 
      activity.id === id ? { ...activity, [field]: value } : activity
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-civeni-blue">Formato Híbrido</h2>
          <p className="text-gray-600">Configure as atividades e imagens do formato híbrido</p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Atividade
        </Button>
      </div>

      <div className="grid gap-6">
        {activities.map((activity) => (
          <Card key={activity.id} className="p-6">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {activity.activity_type === 'exhibition' && 'Estandes de Exposição'}
                  {activity.activity_type === 'keynote' && 'Palestras Magistrais'}
                  {activity.activity_type === 'panel' && 'Discussões em Painel'}
                  {activity.activity_type === 'oral' && 'Comunicações Orais'}
                  {activity.activity_type === 'custom' && activity.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={activity.is_active}
                      onCheckedChange={(checked) => updateActivity(activity.id, 'is_active', checked)}
                    />
                    <Label>Ativo</Label>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${activity.id}`}>Título</Label>
                    <Input
                      id={`title-${activity.id}`}
                      value={activity.title}
                      onChange={(e) => updateActivity(activity.id, 'title', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${activity.id}`}>Descrição</Label>
                    <Textarea
                      id={`description-${activity.id}`}
                      value={activity.description}
                      onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`order-${activity.id}`}>Ordem de Exibição</Label>
                    <Input
                      id={`order-${activity.id}`}
                      type="number"
                      value={activity.order_index}
                      onChange={(e) => updateActivity(activity.id, 'order_index', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <SimpleImageUpload
                    value={activity.image_url}
                    onChange={(value) => updateActivity(activity.id, 'image_url', value)}
                    label="Imagem da Atividade"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave(activity)}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HybridFormatManager;