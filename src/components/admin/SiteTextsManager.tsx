
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Type, Save } from 'lucide-react';
import { useSiteTextsForm } from './hooks/useSiteTextsForm';
import BasicInfoFields from './site-texts/BasicInfoFields';
import SectionTitlesFields from './site-texts/SectionTitlesFields';
import SectionDescriptionsFields from './site-texts/SectionDescriptionsFields';

const SiteTextsManager = () => {
  const { formData, handleSubmit, handleChange } = useSiteTextsForm();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Textos do Site</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Configurações de Texto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <BasicInfoFields formData={formData} onChange={handleChange} />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-civeni-red">Seções do Site</h3>
              
              <SectionTitlesFields formData={formData} onChange={handleChange} />

              <SectionDescriptionsFields formData={formData} onChange={handleChange} />
            </div>

            <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Todos os Textos
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteTextsManager;
