
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Speaker } from '@/contexts/CMSContext';
import ImageUploadField from './ImageUploadField';

interface SpeakerFormProps {
  formData: {
    name: string;
    title: string;
    institution: string;
    image: string;
    bio: string;
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  editingSpeaker: Speaker | null;
  isLoading?: boolean;
}

const SpeakerForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  editingSpeaker, 
  isLoading = false 
}: SpeakerFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <ImageUploadField
          value={formData.image}
          onChange={(imageValue) => setFormData({...formData, image: imageValue})}
          label="Imagem do Palestrante"
          type="speaker"
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-civeni-blue hover:bg-blue-700" disabled={isLoading}>
          {editingSpeaker ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
};

export default SpeakerForm;
