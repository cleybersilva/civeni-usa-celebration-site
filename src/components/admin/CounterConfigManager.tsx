import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCounterSettings } from '@/hooks/useCounterSettings';

const CounterConfigManager = () => {
  const { settings, loading, saving, saveSettings } = useCounterSettings();
  const [formData, setFormData] = useState({
    eventDate: '2025-12-11',
    eventTitlePt: 'III CIVENI 2025',
    eventTitleEn: 'III CIVENI 2025',
    eventTitleEs: 'III CIVENI 2025',
    eventTitleTr: 'III CIVENI 2025',
    eventDescriptionPt: 'Participe do maior evento de educação mundial',
    eventDescriptionEn: 'Join the biggest education event worldwide',
    eventDescriptionEs: 'Únete al mayor evento educativo mundial',
    eventDescriptionTr: 'Dünyanın en büyük eğitim etkinliğine katılın'
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await saveSettings(formData);
      toast.success('Configurações do contador salvas com sucesso!');
    } catch (error) {
      console.error('Error saving counter settings:', error);
      toast.error('Erro ao salvar configurações do contador');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Contador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Date */}
            <div>
              <Label htmlFor="eventDate">Data do Evento</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleChange('eventDate', e.target.value)}
                required
              />
            </div>

            {/* Event Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventTitlePt">Título (Português)</Label>
                <Input
                  id="eventTitlePt"
                  value={formData.eventTitlePt}
                  onChange={(e) => handleChange('eventTitlePt', e.target.value)}
                  placeholder="Título em português"
                />
              </div>
              <div>
                <Label htmlFor="eventTitleEn">Título (English)</Label>
                <Input
                  id="eventTitleEn"
                  value={formData.eventTitleEn}
                  onChange={(e) => handleChange('eventTitleEn', e.target.value)}
                  placeholder="Title in English"
                />
              </div>
              <div>
                <Label htmlFor="eventTitleEs">Título (Español)</Label>
                <Input
                  id="eventTitleEs"
                  value={formData.eventTitleEs}
                  onChange={(e) => handleChange('eventTitleEs', e.target.value)}
                  placeholder="Título en español"
                />
              </div>
              <div>
                <Label htmlFor="eventTitleTr">Başlık (Türkçe)</Label>
                <Input
                  id="eventTitleTr"
                  value={formData.eventTitleTr}
                  onChange={(e) => handleChange('eventTitleTr', e.target.value)}
                  placeholder="Türkçe başlık"
                />
              </div>
            </div>

            {/* Event Descriptions */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventDescriptionPt">Descrição (Português)</Label>
                <Textarea
                  id="eventDescriptionPt"
                  value={formData.eventDescriptionPt}
                  onChange={(e) => handleChange('eventDescriptionPt', e.target.value)}
                  placeholder="Descrição em português"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="eventDescriptionEn">Description (English)</Label>
                <Textarea
                  id="eventDescriptionEn"
                  value={formData.eventDescriptionEn}
                  onChange={(e) => handleChange('eventDescriptionEn', e.target.value)}
                  placeholder="Description in English"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="eventDescriptionEs">Descripción (Español)</Label>
                <Textarea
                  id="eventDescriptionEs"
                  value={formData.eventDescriptionEs}
                  onChange={(e) => handleChange('eventDescriptionEs', e.target.value)}
                  placeholder="Descripción en español"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="eventDescriptionTr">Açıklama (Türkçe)</Label>
                <Textarea
                  id="eventDescriptionTr"
                  value={formData.eventDescriptionTr}
                  onChange={(e) => handleChange('eventDescriptionTr', e.target.value)}
                  placeholder="Türkçe açıklama"
                  rows={3}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CounterConfigManager;