import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Handshake, 
  Star, 
  Trophy, 
  Users, 
  Building2, 
  Globe, 
  Award, 
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const SejaNossoParceiro = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    partnership_type: '',
    message: ''
  });

  const partnershipTypes = [
    { value: 'patrocinio-ouro', label: 'Patrocínio Ouro' },
    { value: 'patrocinio-prata', label: 'Patrocínio Prata' },
    { value: 'patrocinio-bronze', label: 'Patrocínio Bronze' },
    { value: 'apoio-institucional', label: 'Apoio Institucional' },
    { value: 'midia-partner', label: 'Mídia Partner' },
    { value: 'fornecedor-servicos', label: 'Fornecedor de Serviços' },
    { value: 'parceiro-academico', label: 'Parceiro Acadêmico' },
    { value: 'outro', label: 'Outro' }
  ];

  const benefits = [
    {
      icon: Star,
      title: 'Visibilidade de Marca',
      description: 'Logo em destaque durante todo o evento online e presencial'
    },
    {
      icon: Globe,
      title: 'Presença Digital',
      description: 'Inclusão em materiais promocionais, redes sociais e site oficial'
    },
    {
      icon: Users,
      title: 'Networking Qualificado',
      description: 'Acesso direto a profissionais e tomadores de decisão'
    },
    {
      icon: Trophy,
      title: 'Reconhecimento Oficial',
      description: 'Certificado de parceria e menção durante cerimônias'
    },
    {
      icon: Building2,
      title: 'Espaço Personalizado',
      description: 'Estandes, painéis ou ativações personalizadas'
    },
    {
      icon: Award,
      title: 'Relatórios Exclusivos',
      description: 'Dados de engajamento e alcance do seu investimento'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('partner_applications')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Solicitação Enviada!",
        description: "Recebemos sua proposta de parceria. Nossa equipe entrará em contato em breve.",
      });

      // Reset form
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        partnership_type: '',
        message: ''
      });

    } catch (error) {
      console.error('Error submitting partnership application:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-blue-dark">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <Badge className="bg-white/10 text-white border-white/20 mb-4">
                <Handshake className="h-4 w-4 mr-2" />
                Parcerias Estratégicas
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Seja Nosso <span className="text-civeni-accent">Parceiro</span>
              </h1>
              <p className="text-xl text-civeni-blue-light max-w-3xl mx-auto leading-relaxed">
                Junte-se ao III CIVENI 2025 e conecte sua marca a um dos maiores eventos 
                de ciências humanas e tecnologia do Brasil
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-civeni-blue-light">Participantes Esperados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">3</div>
                <div className="text-civeni-blue-light">Dias de Evento</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">100%</div>
                <div className="text-civeni-blue-light">Alcance Digital</div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Vantagens de ser Nosso Parceiro
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Maximize o retorno do seu investimento com benefícios exclusivos 
                e visibilidade estratégica
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-civeni-blue rounded-lg flex items-center justify-center mb-4">
                        <benefit.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Form Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Vamos Conversar?
              </h2>
              <p className="text-xl text-gray-600">
                Preencha o formulário abaixo e nossa equipe entrará em contato
              </p>
            </div>

            <Card className="shadow-2xl border-none">
              <CardHeader className="bg-civeni-blue text-white rounded-t-lg">
                <CardTitle className="text-2xl text-center">
                  Formulário de Interesse
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company_name">Nome da Empresa *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                        placeholder="Ex: Empresa Inovadora Ltda"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_name">Nome do Contato *</Label>
                      <Input
                        id="contact_name"
                        value={formData.contact_name}
                        onChange={(e) => handleInputChange('contact_name', e.target.value)}
                        placeholder="Ex: João Silva"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="contato@empresa.com"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="website">Site da Empresa</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://www.empresa.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="partnership_type">Tipo de Parceria *</Label>
                      <Select value={formData.partnership_type} onValueChange={(value) => handleInputChange('partnership_type', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione o tipo de parceria" />
                        </SelectTrigger>
                        <SelectContent>
                          {partnershipTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Conte-nos mais sobre sua empresa e como podemos trabalhar juntos..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-civeni-blue hover:bg-civeni-blue-dark text-white py-3 text-lg"
                    >
                      {loading ? (
                        "Enviando..."
                      ) : (
                        <>
                          Enviar Proposta de Parceria
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 px-4 bg-civeni-blue text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Tem Dúvidas? Fale Conosco
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <Mail className="h-12 w-12 mb-4 text-civeni-accent" />
                <h3 className="text-xl font-semibold mb-2">E-mail</h3>
                <p className="text-civeni-blue-light">parcerias@civeni2025.com</p>
              </div>
              <div className="flex flex-col items-center">
                <Phone className="h-12 w-12 mb-4 text-civeni-accent" />
                <h3 className="text-xl font-semibold mb-2">Telefone</h3>
                <p className="text-civeni-blue-light">(83) 98832-9018</p>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="h-12 w-12 mb-4 text-civeni-accent" />
                <h3 className="text-xl font-semibold mb-2">Local</h3>
                <p className="text-civeni-blue-light">João Pessoa - PB</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SejaNossoParceiro;