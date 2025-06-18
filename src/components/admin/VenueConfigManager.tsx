
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';
import { MapPin, Plus, Trash2, Save } from 'lucide-react';

const VenueConfigManager = () => {
  const { content, updateVenueConfig } = useCMS();
  const [formData, setFormData] = useState(content.venueConfig);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateVenueConfig(formData);
    alert('Configurações do local atualizadas com sucesso!');
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addFacility = () => {
    setFormData(prev => ({
      ...prev,
      facilities: [...prev.facilities, '']
    }));
  };

  const removeFacility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index)
    }));
  };

  const updateFacility = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.map((facility, i) => i === index ? value : facility)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Configurações do Local</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Local Presencial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Local</label>
                <Input
                  value={formData.venueName}
                  onChange={(e) => handleChange('venueName', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Endereço</label>
                <Input
                  value={formData.venueAddress}
                  onChange={(e) => handleChange('venueAddress', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cidade</label>
                <Input
                  value={formData.venueCity}
                  onChange={(e) => handleChange('venueCity', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <Input
                  value={formData.venueState}
                  onChange={(e) => handleChange('venueState', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">CEP</label>
                <Input
                  value={formData.venueZip}
                  onChange={(e) => handleChange('venueZip', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">País</label>
                <Input
                  value={formData.venueCountry}
                  onChange={(e) => handleChange('venueCountry', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">URL do Mapa (Google Maps Embed)</label>
              <Textarea
                value={formData.mapEmbedUrl}
                onChange={(e) => handleChange('mapEmbedUrl', e.target.value)}
                placeholder="Cole aqui a URL de embed do Google Maps"
                rows={3}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Aeroporto Mais Próximo</label>
                <Input
                  value={formData.nearbyAirport}
                  onChange={(e) => handleChange('nearbyAirport', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Distância do Aeroporto</label>
                <Input
                  value={formData.airportDistance}
                  onChange={(e) => handleChange('airportDistance', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Informações de Estacionamento</label>
                <Input
                  value={formData.parkingInfo}
                  onChange={(e) => handleChange('parkingInfo', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Informações de Hospedagem</label>
                <Input
                  value={formData.accommodationInfo}
                  onChange={(e) => handleChange('accommodationInfo', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium">Facilidades do Local</label>
                <Button type="button" onClick={addFacility} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Facilidade
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.facilities.map((facility, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={facility}
                      onChange={(e) => updateFacility(index, e.target.value)}
                      placeholder="Ex: Wi-Fi gratuito"
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => removeFacility(index)}
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
              Salvar Configurações do Local
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueConfigManager;
