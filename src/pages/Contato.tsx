
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Phone, Mail, Users, Calendar, MessageCircle } from 'lucide-react';

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
    { value: 'duvidas', label: t('contact.subjects.doubts') },
    { value: 'informacoes', label: t('contact.subjects.information') },
    { value: 'sugestoes', label: t('contact.subjects.suggestions') },
    { value: 'reclamacao', label: t('contact.subjects.complaint') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Aqui será implementada a lógica de envio para o banco de dados
      console.log('Dados do formulário:', formData);
      
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(t('contact.success'));
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      alert(t('contact.error'));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li>Contato</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Contato
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Entre em contato conosco para esclarecer dúvidas sobre o III CIVENI 2025 - 
              Estamos aqui para ajudar você a participar desta experiência única de aprendizado mundial
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/inscricoes">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
              
              <a href="mailto:contact@civeni.com">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  E-mail Direto
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-poppins flex items-center justify-center gap-3">
              <MessageCircle className="w-8 h-8 text-civeni-blue" />
              Fale Conosco
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Escolha a melhor forma de entrar em contato. Estamos prontos para atendê-lo!
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Formulário de Contato */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-civeni-blue mb-6 font-poppins text-center">
                {t('contact.formTitle')}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.fullName')} *
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder={t('contact.fullName')}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.email')} *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('contact.email')}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.phone')}
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={t('contact.phoneOptional')}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.subject')} *
                  </label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('contact.selectSubject')} />
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
                    {t('contact.message')} *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder={t('contact.messagePlaceholder')}
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
                  {isSubmitting ? t('contact.sending') : t('contact.sendMessage')}
                </Button>
              </form>
            </div>
            
            {/* Informações de Contato e Mapa */}
            <div className="space-y-8">
              {/* Informações de Contato */}
              <div className="bg-civeni-blue text-white rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 font-poppins text-center">
                  {t('contact.contactInfo')}
                </h2>
                
                <div className="space-y-4 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <MapPin className="w-6 h-6 text-civeni-red" />
                    <div>
                      <p className="font-semibold">{t('contact.address')}</p>
                      <p>{t('contact.addressLine1')}</p>
                      <p>{t('contact.addressLine2')}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <Mail className="w-6 h-6 text-civeni-red" />
                    <div>
                      <p className="font-semibold">{t('contact.email')}:</p>
                      <a 
                        href="mailto:contact@civeni.com" 
                        className="hover:text-civeni-red transition-colors"
                      >
                        contact@civeni.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2">
                    <Phone className="w-6 h-6 text-civeni-red" />
                    <div>
                      <p className="font-semibold">{t('contact.phone')}:</p>
                      <a 
                        href="https://wa.me/14075550123" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-civeni-red transition-colors"
                      >
                        +1 (407) 555-0123
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mapa */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 bg-civeni-blue text-white">
                  <h3 className="text-lg font-bold font-poppins text-center">
                    {t('contact.location')}
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
                    title={t('contact.location')}
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
