
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCMS, Partner } from '@/contexts/CMSContext';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PartnersManager = () => {
  const { content, updatePartners } = useCMS();
  const { toast } = useToast();
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    type: 'academic' as 'organizer' | 'academic' | 'sponsor'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      logo: '',
      type: 'academic'
    });
    setEditingPartner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const partners = [...content.partners];
    
    if (editingPartner) {
      const index = partners.findIndex(p => p.id === editingPartner.id);
      if (index !== -1) {
        partners[index] = {
          ...editingPartner,
          ...formData
        };
      }
    } else {
      const sameTypePartners = partners.filter(p => p.type === formData.type);
      const newPartner: Partner = {
        id: Date.now().toString(),
        ...formData,
        sort_order: sameTypePartners.length + 1
      };
      partners.push(newPartner);
    }

    try {
      await updatePartners(partners);
      toast({
        title: "Sucesso",
        description: editingPartner ? "Parceiro atualizado com sucesso!" : "Parceiro adicionado com sucesso!"
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar parceiro. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo: partner.logo,
      type: partner.type
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (partnerId: string) => {
    if (confirm('Tem certeza que deseja excluir este parceiro?')) {
      try {
        const updatedPartners = content.partners.filter(p => p.id !== partnerId);
        await updatePartners(updatedPartners);
        toast({
          title: "Sucesso",
          description: "Parceiro excluído com sucesso!"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir parceiro. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'organizer': return 'Organizador';
      case 'academic': return 'Parceiro Acadêmico';
      case 'sponsor': return 'Patrocinador';
      default: return type;
    }
  };

  const organizers = content.partners.filter(p => p.type === 'organizer');
  const academics = content.partners.filter(p => p.type === 'academic');
  const sponsors = content.partners.filter(p => p.type === 'sponsor');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Parceiros</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Parceiro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? 'Editar Parceiro' : 'Adicionar Parceiro'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Logo (Emoji ou URL)</label>
                <Input
                  value={formData.logo}
                  onChange={(e) => setFormData({...formData, logo: e.target.value})}
                  placeholder="Ex: 🎓 ou https://..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <Select value={formData.type} onValueChange={(value: 'organizer' | 'academic' | 'sponsor') => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer">Organizador</SelectItem>
                    <SelectItem value="academic">Parceiro Acadêmico</SelectItem>
                    <SelectItem value="sponsor">Patrocinador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                  {editingPartner ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {/* Organizadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Organizadores ({organizers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizers.map((partner) => (
                <div key={partner.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{partner.logo}</span>
                    <div>
                      <h4 className="font-semibold">{partner.name}</h4>
                      <p className="text-sm text-gray-500">{getTypeLabel(partner.type)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(partner)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(partner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Parceiros Acadêmicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Parceiros Acadêmicos ({academics.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {academics.map((partner) => (
                <div key={partner.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{partner.logo}</span>
                    <div>
                      <h4 className="font-semibold">{partner.name}</h4>
                      <p className="text-sm text-gray-500">{getTypeLabel(partner.type)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(partner)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(partner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patrocinadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Patrocinadores ({sponsors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sponsors.map((partner) => (
                <div key={partner.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{partner.logo}</span>
                    <div>
                      <h4 className="font-semibold">{partner.name}</h4>
                      <p className="text-sm text-gray-500">{getTypeLabel(partner.type)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(partner)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(partner.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnersManager;
