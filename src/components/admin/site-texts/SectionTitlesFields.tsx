
import React from 'react';
import { Input } from '@/components/ui/input';
import { SiteTexts } from '@/contexts/types';

interface SectionTitlesFieldsProps {
  formData: SiteTexts;
  onChange: (field: keyof SiteTexts, value: string) => void;
}

const SectionTitlesFields = ({ formData, onChange }: SectionTitlesFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Título - Sobre o Congresso</label>
        <Input
          value={formData.aboutTitle}
          onChange={(e) => onChange('aboutTitle', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Título - Programação</label>
        <Input
          value={formData.scheduleTitle}
          onChange={(e) => onChange('scheduleTitle', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Título - Palestrantes</label>
        <Input
          value={formData.speakersTitle}
          onChange={(e) => onChange('speakersTitle', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Título - Inscrições</label>
        <Input
          value={formData.registrationTitle}
          onChange={(e) => onChange('registrationTitle', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Título - Local do Evento</label>
        <Input
          value={formData.venueTitle}
          onChange={(e) => onChange('venueTitle', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Título - Parceiros</label>
        <Input
          value={formData.partnersTitle}
          onChange={(e) => onChange('partnersTitle', e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default SectionTitlesFields;
