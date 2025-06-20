
import React from 'react';
import { Input } from '@/components/ui/input';
import { SiteTexts } from '@/contexts/types';

interface BasicInfoFieldsProps {
  formData: SiteTexts;
  onChange: (field: keyof SiteTexts, value: string) => void;
}

const BasicInfoFields = ({ formData, onChange }: BasicInfoFieldsProps) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Título do Site</label>
        <Input
          value={formData.siteTitle}
          onChange={(e) => onChange('siteTitle', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Email de Contato</label>
        <Input
          type="email"
          value={formData.contactEmail}
          onChange={(e) => onChange('contactEmail', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Telefone de Contato</label>
        <Input
          value={formData.contactPhone}
          onChange={(e) => onChange('contactPhone', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Copyright do Rodapé</label>
        <Input
          value={formData.footerCopyright}
          onChange={(e) => onChange('footerCopyright', e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default BasicInfoFields;
