
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';
import { Calendar, MapPin, Save } from 'lucide-react';

const EventConfigManager = () => {
  const { content, updateEventConfig } = useCMS();
  const [formData, setFormData] = useState({
    eventDate: content.eventConfig.eventDate,
    eventLocation: content.eventConfig.eventLocation,
    eventCity: content.eventConfig.eventCity
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateEventConfig(formData);
    alert('Configurações do evento atualizadas com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Configurações do Evento</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Contador do Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Data do Evento</label>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Esta data será usada para o contador regressivo na página inicial
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Local do Evento</label>
              <Input
                value={formData.eventLocation}
                onChange={(e) => setFormData({...formData, eventLocation: e.target.value})}
                placeholder="Ex: Celebration, Florida"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                value={formData.eventCity}
                onChange={(e) => setFormData({...formData, eventCity: e.target.value})}
                placeholder="Ex: Celebration"
                required
              />
            </div>

            <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventConfigManager;
