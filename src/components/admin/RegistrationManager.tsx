
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useCMS, RegistrationTier } from '@/contexts/CMSContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

const RegistrationManager = () => {
  const { content, updateRegistrationTiers, updateBatchInfo } = useCMS();
  const [editingTier, setEditingTier] = useState<RegistrationTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [batchInfo, setBatchInfo] = useState(content.batchInfo);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    features: [''],
    recommended: false
  });

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      features: [''],
      recommended: false
    });
    setEditingTier(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tiers = [...content.registrationTiers];
    const features = formData.features.filter(f => f.trim() !== '');
    
    if (editingTier) {
      const index = tiers.findIndex(t => t.id === editingTier.id);
      tiers[index] = {
        ...editingTier,
        ...formData,
        features
      };
    } else {
      const newTier: RegistrationTier = {
        id: Date.now().toString(),
        ...formData,
        features,
        order: tiers.length + 1
      };
      tiers.push(newTier);
    }

    await updateRegistrationTiers(tiers);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (tier: RegistrationTier) => {
    setEditingTier(tier);
    setFormData({
      title: tier.title,
      price: tier.price,
      features: [...tier.features, ''],
      recommended: tier.recommended
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tierId: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      const tiers = content.registrationTiers.filter(t => t.id !== tierId);
      await updateRegistrationTiers(tiers);
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

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

  const handleBatchInfoSave = async () => {
    await updateBatchInfo(batchInfo);
    alert('Informações do lote atualizadas com sucesso!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Lote Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={batchInfo}
              onChange={(e) => setBatchInfo(e.target.value)}
              placeholder="Ex: PRIMEIRO LOTE: 1º de Novembro - 15 de Dezembro, 2024"
            />
            <Button onClick={handleBatchInfoSave} className="bg-civeni-blue hover:bg-blue-700">
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Categorias de Inscrição</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTier ? 'Editar Categoria' : 'Adicionar Categoria'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preço</label>
                <Input
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="Ex: $150"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Características</label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <Input
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      placeholder="Digite uma característica"
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFeature}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Característica
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.recommended}
                  onCheckedChange={(checked) => setFormData({...formData, recommended: checked})}
                />
                <label className="text-sm font-medium">Categoria recomendada (destaque)</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                  {editingTier ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content.registrationTiers.map((tier) => (
          <Card key={tier.id} className={tier.recommended ? 'border-civeni-red border-2' : ''}>
            <CardHeader>
              {tier.recommended && (
                <div className="bg-civeni-red text-white px-3 py-1 rounded-full text-sm font-bold text-center mb-2">
                  MAIS POPULAR
                </div>
              )}
              <CardTitle className="text-center">{tier.title}</CardTitle>
              <div className="text-center">
                <div className="text-3xl font-bold text-civeni-red">{tier.price}</div>
                <div className="text-gray-500">por pessoa</div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(tier)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(tier.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RegistrationManager;
