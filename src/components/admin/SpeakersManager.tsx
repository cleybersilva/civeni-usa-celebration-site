
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCMS, Speaker } from '@/contexts/CMSContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ImageGuide from './ImageGuide';

const SpeakersManager = () => {
  const { content, updateSpeakers } = useCMS();
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    institution: '',
    image: '',
    bio: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      institution: '',
      image: '',
      bio: ''
    });
    setEditingSpeaker(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const speakers = [...content.speakers];
    
    if (editingSpeaker) {
      const index = speakers.findIndex(s => s.id === editingSpeaker.id);
      speakers[index] = {
        ...editingSpeaker,
        ...formData
      };
    } else {
      const newSpeaker: Speaker = {
        id: Date.now().toString(),
        ...formData,
        order: speakers.length + 1
      };
      speakers.push(newSpeaker);
    }

    // Fix Dr. Maria Rodriguez image if it exists
    const mariaIndex = speakers.findIndex(s => s.name.includes('Maria Rodriguez'));
    if (mariaIndex !== -1 && speakers[mariaIndex].image.includes('/lovable-uploads/')) {
      speakers[mariaIndex].image = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    }

    await updateSpeakers(speakers);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name,
      title: speaker.title,
      institution: speaker.institution,
      image: speaker.image,
      bio: speaker.bio
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (speakerId: string) => {
    if (confirm('Tem certeza que deseja excluir este palestrante?')) {
      const speakers = content.speakers.filter(s => s.id !== speakerId);
      await updateSpeakers(speakers);
    }
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Gerenciar Palestrantes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Palestrante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSpeaker ? 'Editar Palestrante' : 'Adicionar Palestrante'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
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
                    <label className="block text-sm font-medium mb-2">Título/Cargo</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Instituição</label>
                    <Input
                      value={formData.institution}
                      onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">URL da Imagem</label>
                    <Input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Biografia</label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
                      {editingSpeaker ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </div>
              
              <div>
                <ImageGuide type="speaker" title="Palestrante" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content.speakers.map((speaker) => (
          <Card key={speaker.id}>
            <CardHeader className="pb-2">
              <img
                src={speaker.name.includes('Maria Rodriguez') ? 
                  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' : 
                  speaker.image
                }
                alt={speaker.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">{speaker.name}</CardTitle>
              <p className="text-sm text-civeni-red font-semibold mb-1">{speaker.title}</p>
              <p className="text-sm text-gray-600 mb-2">{speaker.institution}</p>
              <p className="text-sm text-gray-700 mb-4 line-clamp-3">{speaker.bio}</p>
              <div className="flex justify-end space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(speaker)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(speaker.id)}
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

export default SpeakersManager;
