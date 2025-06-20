
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { SiteTexts } from '@/contexts/types';

interface SectionDescriptionsFieldsProps {
  formData: SiteTexts;
  onChange: (field: keyof SiteTexts, value: string) => void;
}

const SectionDescriptionsFields = ({ formData, onChange }: SectionDescriptionsFieldsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Descrição - Sobre o Congresso</label>
        <Textarea
          value={formData.aboutDescription}
          onChange={(e) => onChange('aboutDescription', e.target.value)}
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descrição - Programação</label>
        <Textarea
          value={formData.scheduleDescription}
          onChange={(e) => onChange('scheduleDescription', e.target.value)}
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descrição - Palestrantes</label>
        <Textarea
          value={formData.speakersDescription}
          onChange={(e) => onChange('speakersDescription', e.target.value)}
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descrição - Inscrições</label>
        <Textarea
          value={formData.registrationDescription}
          onChange={(e) => onChange('registrationDescription', e.target.value)}
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descrição - Local do Evento</label>
        <Textarea
          value={formData.venueDescription}
          onChange={(e) => onChange('venueDescription', e.target.value)}
          rows={2}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Descrição - Parceiros</label>
        <Textarea
          value={formData.partnersDescription}
          onChange={(e) => onChange('partnersDescription', e.target.value)}
          rows={2}
          required
        />
      </div>
    </div>
  );
};

export default SectionDescriptionsFields;
