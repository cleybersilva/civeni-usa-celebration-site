
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';
import { Monitor, Plus, Trash2, Save } from 'lucide-react';

const OnlineConfigManager = () => {
  const { content, updateOnlineConfig } = useCMS();
  const [formData, setFormData] = useState(content.onlineConfig);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOnlineConfig(formData);
    alert('Configurações online atualizadas com sucesso!');
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Configurações Online</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Plataforma Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Plataforma</label>
                <Input
                  value={formData.platform}
                  onChange={(e) => handleChange('platform', e.target.value)}
                  placeholder="Ex: YouTube Live"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Canal</label>
                <Input
                  value={formData.channelName}
                  onChange={(e) => handleChange('channelName', e.target.value)}
                  placeholder="Ex: @CiveniUSA2025"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Informações de Acesso</label>
              <Textarea
                value={formData.accessInfo}
                onChange={(e) => handleChange('accessInfo', e.target.value)}
                placeholder="Descreva como os participantes podem acessar o evento online"
                rows={3}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">Recursos Online</label>
                <Button type="button" onClick={addFeature} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Recurso
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Ex: Streaming HD"
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => removeFeature(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações Online
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnlineConfigManager;
