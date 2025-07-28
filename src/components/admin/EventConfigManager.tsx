
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCMS } from '@/contexts/CMSContext';
import { Calendar, MapPin, Save, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

const EventConfigManager = () => {
  const { content, updateEventConfig } = useCMS();
  const [formData, setFormData] = useState({
    eventDate: content.eventConfig.eventDate,
    eventLocation: content.eventConfig.eventLocation,
    eventCity: content.eventConfig.eventCity,
    startTime: content.eventConfig.startTime || '09:00',
    endTime: content.eventConfig.endTime || '18:00'
  });
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Atualizar contador em tempo real baseado na data selecionada
  useEffect(() => {
    if (!formData.eventDate) return;
    
    const targetDate = new Date(formData.eventDate + 'T00:00:00').getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [formData.eventDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateEventConfig(formData);
      toast.success('Configurações do evento atualizadas com sucesso!');
      
      // Força recarregamento da página principal para atualizar o contador
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('eventConfigUpdated'));
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao atualizar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-civeni-blue">Configurações do Evento</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Configurações do Contador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data do Evento</label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Esta data será usada para o contador regressivo na página inicial
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Local do Evento</label>
                <Input
                  value={formData.eventLocation}
                  onChange={(e) => setFormData({...formData, eventLocation: e.target.value})}
                  placeholder="Ex: Celebration, Florida"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Cidade</label>
                <Input
                  value={formData.eventCity}
                  onChange={(e) => setFormData({...formData, eventCity: e.target.value})}
                  placeholder="Ex: Celebration"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Horário de Início</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Horário de Término</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Prévia do Contador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Prévia do Contador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-civeni-blue to-civeni-red rounded-lg p-6 text-white">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">III CIVENI 2025</h3>
                <p className="text-sm opacity-90">{formData.eventLocation}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{timeLeft.days.toString().padStart(2, '0')}</div>
                  <div className="text-xs opacity-90">Dias</div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-xs opacity-90">Horas</div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-xs opacity-90">Minutos</div>
                </div>
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-xs opacity-90">Segundos</div>
                </div>
              </div>
              
              {formData.eventDate && (
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                    <Clock className="w-4 h-4" />
                    {new Date(formData.eventDate).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventConfigManager;
