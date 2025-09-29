import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Download, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import civeniLogo from '@/assets/civeni-2025-logo.png';

const CertificadoEmissao = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    keywords: ['', '', '']
  });

  const [loading, setLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    pdfUrl?: string;
    matched?: number;
    code?: string;
  } | null>(null);

  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    const loadEvent = async () => {
      const eventSlug = slug || 'iii-civeni-2025';
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_certificates (
            is_enabled,
            required_correct,
            keywords,
            issuer_name,
            hours,
            city,
            country
          )
        `)
        .eq('slug', eventSlug)
        .eq('status_publicacao', 'published')
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Evento não encontrado ou certificados não habilitados"
        });
        setEventLoading(false);
        return;
      }

      if (!data.event_certificates || !data.event_certificates.is_enabled) {
        toast({
          variant: "destructive", 
          title: "Erro",
          description: "Este evento não possui certificados habilitados"
        });
        setEventLoading(false);
        return;
      }

      setEvent(data);
      setEventLoading(false);
    };

    loadEvent();
  }, [slug, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'fullName' ? value.slice(0, 50) : value
    }));
  };

  const handleKeywordChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.map((kw, i) => i === index ? value : kw)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('issue-certificate', {
        body: {
          eventId: event.id,
          email: formData.email.toLowerCase().trim(),
          fullName: formData.fullName.trim(),
          keywords: formData.keywords.map(kw => kw.trim())
        }
      });

      if (error) throw error;

      setResult({
        success: data.success,
        message: data.message,
        pdfUrl: data.pdfUrl,
        matched: data.matched,
        code: data.code
      });

      if (data.success) {
        toast({
          title: "Sucesso!",
          description: "Certificado emitido com sucesso!"
        });
      }

    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Erro ao processar solicitação"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email) && 
           formData.fullName.trim().length >= 2 &&
           formData.keywords.every(kw => kw.trim().length > 0);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-civeni-blue to-civeni-red">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-civeni-blue to-civeni-red">
        <Card className="p-8 text-center">
          <XCircle className="h-16 w-16 text-civeni-red mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Evento não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            O evento solicitado não foi encontrado ou não possui certificados habilitados.
          </p>
          <Button onClick={() => navigate('/eventos')} className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white">
            Voltar para Eventos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-red">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-7xl w-full">
          
          {/* Coluna Esquerda - Conteúdo Congratulatório */}
          <div className="text-white space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Parabéns por ter chegado ao final do evento!
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Agora é hora de emitir seu certificado!
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                <span>Compartilhe no LinkedIn</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                <span>Siga o CIVENI 2025 nas redes</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                <span>Conheça nossos{' '}
                  <button 
                    onClick={() => navigate('/eventos')} 
                    className="font-bold underline hover:text-white transition-colors cursor-pointer"
                  >
                    próximos eventos
                  </button>
                </span>
              </div>
            </div>

            {/* Mock do Certificado */}
            <div className="mt-12">
              <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-auto transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="text-center">
                  <img 
                    src={civeniLogo} 
                    alt="CIVENI 2025" 
                    className="w-16 h-auto mx-auto mb-2"
                  />
                  <div className="text-civeni-blue font-bold text-lg mb-2">CIVENI 2025</div>
                  <div className="text-sm text-gray-600 mb-4">CERTIFICADO DE PARTICIPAÇÃO</div>
                  <div className="text-xs text-gray-500 mb-6">{event.slug}</div>
                  
                  <div className="border-t border-b border-gray-200 py-4 mb-4">
                    <div className="text-xs text-gray-600 mb-1">Certificamos que</div>
                    <div className="font-bold text-gray-800">[SEU NOME AQUI]</div>
                    <div className="text-xs text-gray-600 mt-1">participou do evento</div>
                  </div>
                  
                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <div className="w-16 h-8 bg-civeni-blue/10 rounded mb-1"></div>
                      <div className="text-gray-500">Assinatura</div>
                    </div>
                    <div className="w-12 h-12 bg-civeni-blue/10 rounded"></div>
                  </div>
                </div>
                 </div>
               </div>
               
               {/* Botão Voltar para a Home */}
               <div className="mt-8 text-center">
                 <Button
                   onClick={() => navigate('/')}
                   className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white"
                 >
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Voltar para a Home
                 </Button>
               </div>
             </div>

          {/* Coluna Direita - Formulário */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-white shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Emita seu certificado</CardTitle>
                    <p className="text-white/90 text-sm">{event.slug}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-white text-civeni-blue px-3 py-1 rounded font-bold text-sm">
                      VCCU/Civeni
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      E-mail cadastrado no evento
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="exemplo@email.com"
                      className="border-gray-300"
                      required
                    />
                  </div>

                  {/* Nome Completo */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Nome completo (máx. 50 caracteres)
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Nome que aparecerá no certificado"
                      maxLength={50}
                      className="border-gray-300"
                      required
                    />
                  </div>

                  {/* Confirmação de Presença */}
                  <div className="bg-civeni-blue/5 p-4 rounded-lg space-y-4 border border-civeni-blue/20">
                    <div>
                      <h3 className="font-semibold text-civeni-blue mb-1">Confirmação de Presença</h3>
                       <p className="text-xs text-civeni-blue/80 mb-3">
                         Digite as{' '}
                         <span className="font-medium">palavras-chave informadas</span>{' '}
                         durante o evento.
                       </p>
                       <p className="text-xs text-civeni-blue font-medium">
                         Atenção: É necessário acertar pelo menos 2 de 3 palavras.
                       </p>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.keywords.map((keyword, index) => (
                        <div key={index}>
                          <Label htmlFor={`keyword-${index}`} className="text-xs font-medium text-civeni-blue">
                            Palavra-chave {index + 1}:
                          </Label>
                          <Input
                            id={`keyword-${index}`}
                            type="text"
                            value={keyword}
                            onChange={(e) => handleKeywordChange(index, e.target.value)}
                            placeholder=""
                            className="border-civeni-blue/20 text-sm focus:border-civeni-blue"
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resultado */}
                  {result && (
                    <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                          {result.message}
                        </span>
                      </div>
                      
                       {!result.success && typeof result.matched === 'number' && (
                         <p className="text-xs text-red-600 mt-2">
                           Você acertou {result.matched}/3 palavras-chave. 
                           Mínimo necessário: {event.event_certificates?.required_correct || 2}/3.
                         </p>
                       )}
                      
                      {result.success && result.pdfUrl && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            onClick={() => window.open(result.pdfUrl, '_blank')}
                            className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Certificado
                          </Button>
                          {result.code && (
                            <p className="text-xs text-civeni-green mt-2 text-center">
                              Código: {result.code}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botão Principal */}
                  <Button
                    type="submit"
                    disabled={!isFormValid() || loading}
                    className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white font-bold py-3 text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'EMITA SEU CERTIFICADO!'
                    )}
                  </Button>
                  
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificadoEmissao;