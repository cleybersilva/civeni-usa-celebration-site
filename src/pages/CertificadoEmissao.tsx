import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Award, Download, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CertificadoEmissao = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    keywords: ['', '', '', '', '']
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    pdfUrl?: string;
    matched?: number;
    code?: string;
  } | null>(null);

  const [event, setEvent] = useState<any>(null);

  React.useEffect(() => {
    const loadEvent = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_certificates (
            is_enabled,
            required_correct,
            issuer_name,
            hours,
            city,
            country
          )
        `)
        .eq('slug', slug)
        .eq('status_publicacao', 'published')
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Evento não encontrado"
        });
        navigate('/eventos');
        return;
      }

      if (!data.event_certificates?.is_enabled) {
        toast({
          variant: "destructive", 
          title: "Erro",
          description: "Este evento não possui certificados habilitados"
        });
        navigate('/eventos');
        return;
      }

      setEvent(data);
    };

    loadEvent();
  }, [slug, navigate, toast]);

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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Coluna Esquerda */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-primary mb-4">
                🎉 Parabéns por ter chegado ao final do evento!
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Agora você pode emitir seu certificado de participação
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Award className="h-6 w-6 text-primary" />
                <span>Compartilhe sua conquista no LinkedIn</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <span>Fique atento às próximas turmas e eventos</span>
              </div>
              <div className="flex items-center space-x-3">
                <Download className="h-6 w-6 text-blue-600" />
                <span>Baixe seu certificado em alta qualidade</span>
              </div>
            </div>

            {/* Mock do Certificado */}
            <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="aspect-[4/3] bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between">
                <div className="text-center">
                  <div className="text-sm font-semibold text-primary mb-2">CERTIFICADO</div>
                  <div className="text-xs text-muted-foreground">{event.slug}</div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs mb-2">Certificamos que</div>
                  <div className="font-bold text-sm">[SEU NOME AQUI]</div>
                  <div className="text-xs mt-2">participou do evento</div>
                  <div className="font-semibold text-xs">{event.slug}</div>
                </div>
                
                <div className="flex justify-between items-end">
                  <div className="text-xs text-center">
                    <div className="w-16 h-4 bg-muted rounded mb-1"></div>
                    <div>Assinatura</div>
                  </div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </Card>
          </div>

          {/* Coluna Direita */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Emita seu certificado</CardTitle>
              <p className="text-muted-foreground">{event.slug}</p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail cadastrado no evento *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {/* Nome Completo */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Nome completo * 
                    <span className="text-sm text-muted-foreground">
                      ({formData.fullName.length}/50)
                    </span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Nome que aparecerá no certificado"
                    maxLength={50}
                    required
                  />
                </div>

                {/* Palavras-chave */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Confirmação de Presença</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Digite as palavras-chave informadas durante o evento. 
                      É necessário acertar pelo menos {event.event_certificates?.required_correct || 4} de 5 para emitir o certificado.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {formData.keywords.map((keyword, index) => (
                      <div key={index}>
                        <Label htmlFor={`keyword-${index}`}>
                          Palavra-chave {index + 1} *
                        </Label>
                        <Input
                          id={`keyword-${index}`}
                          type="text"
                          value={keyword}
                          onChange={(e) => handleKeywordChange(index, e.target.value)}
                          placeholder={`Digite a ${index + 1}ª palavra-chave`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resultado */}
                {result && (
                  <Card className={`p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                        {result.message}
                      </span>
                    </div>
                    
                    {!result.success && typeof result.matched === 'number' && (
                      <p className="text-sm text-red-600 mt-2">
                        Você acertou {result.matched}/5 palavras-chave. 
                        Mínimo necessário: {event.event_certificates?.required_correct || 4}/5.
                      </p>
                    )}
                    
                    {result.success && result.pdfUrl && (
                      <div className="mt-4">
                        <Button
                          type="button"
                          onClick={() => window.open(result.pdfUrl, '_blank')}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Certificado
                        </Button>
                        <p className="text-xs text-green-600 mt-2">
                          Código de verificação: {result.code}
                        </p>
                      </div>
                    )}
                  </Card>
                )}

                {/* Botão */}
                <Button
                  type="submit"
                  disabled={!isFormValid() || loading}
                  className="w-full h-12 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Award className="h-5 w-5 mr-2" />
                      EMITIR SEU CERTIFICADO!
                    </>
                  )}
                </Button>
                
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CertificadoEmissao;