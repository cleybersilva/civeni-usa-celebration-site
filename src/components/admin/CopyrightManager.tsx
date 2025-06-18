
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';
import { Copyright, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CopyrightManager = () => {
  const { content, updateSiteTexts } = useCMS();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    footerCopyright: content.siteTexts.footerCopyright,
    institutionalLink: content.siteTexts.institutionalLink || '',
    copyrightEn: content.siteTexts.copyrightEn || '',
    copyrightPt: content.siteTexts.copyrightPt || '',
    copyrightEs: content.siteTexts.copyrightEs || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiteTexts({
        ...content.siteTexts,
        ...formData
      });
      toast({
        title: "Sucesso",
        description: "Configurações de copyright atualizadas com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Configurações de Copyright</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copyright className="w-5 h-5" />
            Gerenciar Copyright do Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Copyright Principal (Rodapé)</label>
              <Input
                value={formData.footerCopyright}
                onChange={(e) => handleChange('footerCopyright', e.target.value)}
                placeholder="Ex: © 2025 VCCU. Todos os direitos reservados."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Este texto será exibido no rodapé do site
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Link Institucional (Opcional)</label>
              <Input
                type="url"
                value={formData.institutionalLink}
                onChange={(e) => handleChange('institutionalLink', e.target.value)}
                placeholder="Ex: https://www.vccu.edu"
              />
              <p className="text-xs text-gray-500 mt-1">
                Link para o site oficial da instituição
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-civeni-red">Traduções Multilíngues</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">Copyright em Inglês</label>
                <Textarea
                  value={formData.copyrightEn}
                  onChange={(e) => handleChange('copyrightEn', e.target.value)}
                  placeholder="Ex: © 2025 Veni Creator Christian University. All rights reserved."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Copyright em Português (Brasil)</label>
                <Textarea
                  value={formData.copyrightPt}
                  onChange={(e) => handleChange('copyrightPt', e.target.value)}
                  placeholder="Ex: © 2025 Universidade Cristã Veni Creator. Todos os direitos reservados."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Copyright em Espanhol</label>
                <Textarea
                  value={formData.copyrightEs}
                  onChange={(e) => handleChange('copyrightEs', e.target.value)}
                  placeholder="Ex: © 2025 Universidad Cristiana Veni Creator. Todos los derechos reservados."
                  rows={2}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-civeni-blue mb-2">Prévia do Copyright:</h4>
              <p className="text-sm text-gray-700">
                {formData.footerCopyright || "© 2025 VCCU. Todos os direitos reservados."}
              </p>
              {formData.institutionalLink && (
                <a 
                  href={formData.institutionalLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-civeni-blue text-sm underline"
                >
                  Link Institucional
                </a>
              )}
            </div>

            <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações de Copyright
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CopyrightManager;
