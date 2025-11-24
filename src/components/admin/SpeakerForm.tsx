
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Speaker } from '@/contexts/CMSContext';
import ImageUploadField from './ImageUploadField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { COUNTRIES, getFlagEmoji } from '@/utils/countryFlags';

interface SpeakerFormProps {
  formData: {
    name: string;
    title: string;
    institution: string;
    image: string;
    bio: string;
    countryName?: string;
    countryCode?: string;
    showFlag?: boolean;
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
      
      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold text-sm">País / Bandeira</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">País</label>
          <Select
            value={formData.countryCode || ""}
            onValueChange={(value) => {
              const country = COUNTRIES.find(c => c.code === value);
              setFormData({
                ...formData,
                countryCode: value,
                countryName: country?.name || ""
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um país">
                {formData.countryCode && (
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{getFlagEmoji(formData.countryCode)}</span>
                    {formData.countryName}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{getFlagEmoji(country.code)}</span>
                    {country.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="show-flag"
            checked={formData.showFlag ?? true}
            onCheckedChange={(checked) => setFormData({...formData, showFlag: checked})}
          />
          <Label htmlFor="show-flag" className="text-sm font-medium cursor-pointer">
            Exibir bandeira no card deste palestrante
          </Label>
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
