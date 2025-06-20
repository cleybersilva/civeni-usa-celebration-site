
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Phone, Mail } from 'lucide-react';

const Contato = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjects = [
    { value: 'duvidas', label: 'Dúvidas' },
    { value: 'informacoes', label: 'Informações' },
    { value: 'sugestoes', label: 'Sugestões' },
    { value: 'reclamacao', label: 'Reclamação' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Aqui será implementada a lógica de envio para o banco de dados
      console.log('Dados do formulário:', formData);
      
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-civeni-blue mb-6 font-poppins">
              Entre em Contato
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Estamos aqui para ajudar. Entre em contato conosco para dúvidas, informações ou sugestões.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Formulário de Contato */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-6 font-poppins text-center">
                Formulário de Contato
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Digite seu nome completo"
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Digite seu telefone (opcional)"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assunto *
                  </label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Digite sua mensagem"
                    required
                    rows={5}
                    className="w-full"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-civeni-blue hover:bg-blue-700 text-white font-semibold py-3"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                </Button>
              </form>
            </div>
            
            {/* Informações de Contato e Mapa */}
            <div className="space-y-8">
              {/* Informações de Contato */}
              <div className="bg-civeni-blue text-white rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 font-poppins text-center">
                  Informações de Contato
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <MapPin className="w-6 h-6 text-civeni-red" />
                    <div>
                      <p className="font-semibold">Endereço:</p>
                      <p>800 Celebration Ave. Unit 305&306</p>
                      <p>Celebration, FL 34747 - EUA</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Mail className="w-6 h-6 text-civeni-red" />
                    <div>
                      <p className="font-semibold">E-mail:</p>
                      <p>contact@civeni.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Phone className="w-6 h-6 text-civeni-red" />
                    <div>
                      <p className="font-semibold">Telefone:</p>
                      <p>+1 (407) 555-0123</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mapa */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 bg-civeni-blue text-white">
                  <h3 className="text-lg font-bold font-poppins text-center">
                    Nossa Localização
                  </h3>
                </div>
                <div className="aspect-video">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3510.3689267193375!2d-81.52727708888913!3d28.325288675848967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88dd7f3b0f2d3e8b%3A0x5e35b3e5a34d8e4f!2s800%20Celebration%20Ave%2C%20Celebration%2C%20FL%2034747%2C%20USA!5e0!3m2!1sen!2sus!4v1640995200000!5m2!1sen!2sus"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização III CIVENI 2025"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contato;
