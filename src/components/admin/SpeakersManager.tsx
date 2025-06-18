
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';

const SpeakersManager = () => {
  const { content, updateSpeakers } = useCMS();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    image: '/placeholder.svg'
  });

  const handleAdd = () => {
    const newSpeaker = {
      id: Date.now().toString(),
      ...formData
    };
    updateSpeakers([...content.speakers, newSpeaker]);
    setFormData({ name: '', title: '', company: '', bio: '', image: '/placeholder.svg' });
  };

  const handleEdit = (speaker: any) => {
    setEditingId(speaker.id);
    setFormData(speaker);
  };

  const handleUpdate = () => {
    const updatedSpeakers = content.speakers.map(speaker =>
      speaker.id === editingId ? { ...speaker, ...formData } : speaker
    );
    updateSpeakers(updatedSpeakers);
    setEditingId(null);
    setFormData({ name: '', title: '', company: '', bio: '', image: '/placeholder.svg' });
  };

  const handleDelete = (id: string) => {
    const filteredSpeakers = content.speakers.filter(speaker => speaker.id !== id);
    updateSpeakers(filteredSpeakers);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Editar Palestrante' : 'Adicionar Palestrante'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nome do Palestrante"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input
            placeholder="Cargo"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
          <Input
            placeholder="Empresa/Instituição"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
          />
          <textarea
            className="w-full p-2 border rounded"
            placeholder="Biografia"
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            rows={4}
          />
          <Input
            placeholder="URL da Imagem"
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
          />
          <Button 
            onClick={editingId ? handleUpdate : handleAdd}
            className="bg-civeni-blue hover:bg-blue-700"
          >
            {editingId ? 'Atualizar' : 'Adicionar'} Palestrante
          </Button>
          {editingId && (
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', title: '', company: '', bio: '', image: '/placeholder.svg' });
              }}
            >
              Cancelar
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {content.speakers.map((speaker) => (
          <Card key={speaker.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{speaker.name}</h3>
                  <p className="text-sm text-gray-600">{speaker.title} - {speaker.company}</p>
                  <p className="text-sm mt-2">{speaker.bio}</p>
                </div>
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(speaker)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(speaker.id)}>
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

export default SpeakersManager;
