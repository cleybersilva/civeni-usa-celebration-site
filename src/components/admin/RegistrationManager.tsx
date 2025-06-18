
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';

const RegistrationManager = () => {
  const { content, updateRegistrationTiers } = useCMS();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    features: [''],
    highlighted: false
  });

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({...formData, features: newFeatures});
  };

  const addFeature = () => {
    setFormData({...formData, features: [...formData.features, '']});
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({...formData, features: newFeatures});
  };

  const handleAdd = () => {
    const newTier = {
      id: Date.now().toString(),
      ...formData,
      features: formData.features.filter(f => f.trim() !== '')
    };
    updateRegistrationTiers([...content.registrationTiers, newTier]);
    setFormData({ name: '', price: '', description: '', features: [''], highlighted: false });
  };

  const handleEdit = (tier: any) => {
    setEditingId(tier.id);
    setFormData(tier);
  };

  const handleUpdate = () => {
    const updatedTiers = content.registrationTiers.map(tier =>
      tier.id === editingId ? { ...tier, ...formData, features: formData.features.filter(f => f.trim() !== '') } : tier
    );
    updateRegistrationTiers(updatedTiers);
    setEditingId(null);
    setFormData({ name: '', price: '', description: '', features: [''], highlighted: false });
  };

  const handleDelete = (id: string) => {
    const filteredTiers = content.registrationTiers.filter(tier => tier.id !== id);
    updateRegistrationTiers(filteredTiers);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Editar Tipo de Inscrição' : 'Adicionar Tipo de Inscrição'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nome do Tipo"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input
            placeholder="Preço (ex: $250)"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
          />
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
          />
          
          <div>
            <label className="block text-sm font-medium mb-2">Características:</label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  placeholder="Digite uma característica"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => removeFeature(index)}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>
              Adicionar Característica
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="highlighted"
              checked={formData.highlighted}
              onChange={(e) => setFormData({...formData, highlighted: e.target.checked})}
            />
            <label htmlFor="highlighted" className="text-sm">Destacar este plano</label>
          </div>

          <Button 
            onClick={editingId ? handleUpdate : handleAdd}
            className="bg-civeni-blue hover:bg-blue-700"
          >
            {editingId ? 'Atualizar' : 'Adicionar'} Tipo de Inscrição
          </Button>
          {editingId && (
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', price: '', description: '', features: [''], highlighted: false });
              }}
            >
              Cancelar
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {content.registrationTiers.map((tier) => (
          <Card key={tier.id} className={tier.highlighted ? 'border-civeni-blue bg-blue-50' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{tier.name}</h3>
                  <p className="text-lg font-bold text-civeni-green">{tier.price}</p>
                  <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                  <ul className="text-sm mt-2 space-y-1">
                    {tier.features.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                  {tier.highlighted && <span className="text-xs bg-civeni-blue text-white px-2 py-1 rounded mt-2 inline-block">DESTACADO</span>}
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(tier)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(tier.id)}>
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

export default RegistrationManager;
