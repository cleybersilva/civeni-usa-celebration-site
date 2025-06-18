
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCMS, Speaker } from '@/contexts/CMSContext';
import { Plus } from 'lucide-react';
import SpeakerCard from './SpeakerCard';
import SpeakerFormDialog from './SpeakerFormDialog';

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
        <Button onClick={handleAdd} className="bg-civeni-green hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Palestrante
        </Button>
      </div>

      <SpeakerFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingSpeaker={editingSpeaker}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {content.speakers.map((speaker) => (
          <SpeakerCard
            key={speaker.id}
            speaker={speaker}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default SpeakersManager;
