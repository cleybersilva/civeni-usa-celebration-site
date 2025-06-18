
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';
import { Type, Save, Copyright } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SiteTextsManager = () => {
  const { content, updateSiteTexts } = useCMS();
  const [formData, setFormData] = useState(content.siteTexts);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSiteTexts(formData);
      toast({
        title: "Textos atualizados",
        description: "Textos do site atualizados com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar os textos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título do Site</label>
                <Input
                  value={formData.siteTitle}
                  onChange={(e) => handleChange('siteTitle', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email de Contato</label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Telefone de Contato</label>
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-civeni-red">Seções do Site</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título - Sobre o Congresso</label>
                  <Input
                    value={formData.aboutTitle}
                    onChange={(e) => handleChange('aboutTitle', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Título - Programação</label>
                  <Input
                    value={formData.scheduleTitle}
                    onChange={(e) => handleChange('scheduleTitle', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição - Sobre o Congresso</label>
                <Textarea
                  value={formData.aboutDescription}
                  onChange={(e) => handleChange('aboutDescription', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição - Programação</label>
                <Textarea
                  value={formData.scheduleDescription}
                  onChange={(e) => handleChange('scheduleDescription', e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título - Palestrantes</label>
                  <Input
                    value={formData.speakersTitle}
                    onChange={(e) => handleChange('speakersTitle', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Título - Inscrições</label>
                  <Input
                    value={formData.registrationTitle}
                    onChange={(e) => handleChange('registrationTitle', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição - Palestrantes</label>
                <Textarea
                  value={formData.speakersDescription}
                  onChange={(e) => handleChange('speakersDescription', e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição - Inscrições</label>
                <Textarea
                  value={formData.registrationDescription}
                  onChange={(e) => handleChange('registrationDescription', e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título - Local do Evento</label>
                  <Input
                    value={formData.venueTitle}
                    onChange={(e) => handleChange('venueTitle', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Título - Parceiros</label>
                  <Input
                    value={formData.partnersTitle}
                    onChange={(e) => handleChange('partnersTitle', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição - Local do Evento</label>
                <Textarea
                  value={formData.venueDescription}
                  onChange={(e) => handleChange('venueDescription', e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição - Parceiros</label>
                <Textarea
                  value={formData.partnersDescription}
                  onChange={(e) => handleChange('partnersDescription', e.target.value)}
                  rows={2}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="bg-civeni-blue hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Todos os Textos
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Seção de Copyright */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copyright className="w-5 h-5" />
            Configurações de Copyright
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Copyright do Rodapé</label>
              <Input
                value={formData.footerCopyright}
                onChange={(e) => handleChange('footerCopyright', e.target.value)}
                placeholder="Ex: © 2025 VCCU. All rights reserved."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Este texto aparecerá no rodapé do site
              </p>
            </div>

            <Button 
              type="button" 
              onClick={handleSubmit}
              className="bg-civeni-green hover:bg-green-600"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Copyright
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteTextsManager;
