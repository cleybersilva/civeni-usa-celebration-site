
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Speaker } from '@/contexts/CMSContext';
import ImageUploadField from './ImageUploadField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/data/countries';

interface SpeakerFormProps {
  formData: {
    name: string;
    title: string;
    institution: string;
    image: string;
    bio: string;
    countryCode?: string;
    flagImageUrl?: string;
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
      
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-3">Bandeiras (Opcional)</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Você pode adicionar bandeiras de 3 formas: emojis no nome/instituição (🇧🇷 🇺🇸), selecionar país para bandeira automática, ou fazer upload de imagem personalizada.
        </p>
        
        <div>
          <label className="block text-sm font-medium mb-2">País (Bandeira Automática)</label>
          <Select 
            value={formData.countryCode || ''} 
            onValueChange={(value) => setFormData({...formData, countryCode: value || undefined})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um país..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <ImageUploadField
            value={formData.flagImageUrl || ''}
            onChange={(imageValue) => setFormData({...formData, flagImageUrl: imageValue || undefined})}
            label="Bandeira Personalizada (PNG/SVG)"
            type="speaker"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Se fornecida, esta imagem terá prioridade sobre a bandeira automática.
          </p>
        </div>
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
