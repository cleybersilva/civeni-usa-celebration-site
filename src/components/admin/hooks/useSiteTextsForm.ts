
import { useState } from 'react';
import { useCMS } from '@/contexts/CMSContext';
import { useToast } from '@/hooks/use-toast';

export const useSiteTextsForm = () => {
  const { content, updateSiteTexts } = useCMS();
  const { toast } = useToast();
  const [formData, setFormData] = useState(content.siteTexts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiteTexts(formData);
      toast({
        title: "Sucesso",
        description: "Textos do site atualizados com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar textos. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    formData,
    handleSubmit,
    handleChange
  };
};
