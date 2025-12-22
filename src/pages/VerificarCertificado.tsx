import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, Search, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface VerificationResult {
  valid: boolean;
  message: string;
  holderName?: string;
  eventSlug?: string;
  issuedAt?: string;
}

const VerificarCertificado = () => {
  const { code: urlCode } = useParams();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code');
  
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Get code from URL params or query string
  const codeFromUrl = urlCode || queryCode;

  useEffect(() => {
    if (codeFromUrl) {
      setInputCode(codeFromUrl);
      verifyCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      setResult({
        valid: false,
        message: 'Por favor, insira um código de verificação'
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { code: codeToVerify.trim() }
      });

      if (error) throw error;

      setResult(data);
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        valid: false,
        message: 'Erro ao verificar certificado. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(inputCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Verificação de Certificado</h1>
            <p className="text-muted-foreground">
              Insira o código de verificação do certificado para confirmar sua autenticidade
            </p>
          </div>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Código de Verificação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Certificado</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      type="text"
                      placeholder="Ex: CIVENI-2024-ABC123"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !inputCode.trim()}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="ml-2">Verificar</span>
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Result Section */}
          {hasSearched && !loading && result && (
            <Card className={result.valid ? 'border-green-500' : 'border-destructive'}>
              <CardContent className="py-8">
                <div className="space-y-6">
                  <div className="flex justify-center">
                    {result.valid ? (
                      <div className="p-4 bg-green-100 rounded-full">
                        <CheckCircle className="h-16 w-16 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-4 bg-red-100 rounded-full">
                        <XCircle className="h-16 w-16 text-red-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <h3 className={`text-xl font-semibold ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                      {result.valid ? 'Certificado Válido' : 'Certificado Não Encontrado'}
                    </h3>
                    <p className="text-muted-foreground mt-2">{result.message}</p>
                  </div>
                  
                  {result.valid && result.holderName && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
                      <h4 className="font-semibold text-green-800 mb-4">Detalhes do Certificado</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-green-200 pb-2">
                          <span className="font-medium text-green-700">Portador:</span>
                          <span className="text-green-900">{result.holderName}</span>
                        </div>
                        <div className="flex justify-between border-b border-green-200 pb-2">
                          <span className="font-medium text-green-700">Evento:</span>
                          <span className="text-green-900">{result.eventSlug}</span>
                        </div>
                        <div className="flex justify-between border-b border-green-200 pb-2">
                          <span className="font-medium text-green-700">Data de Emissão:</span>
                          <span className="text-green-900">
                            {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-green-700">Código:</span>
                          <span className="text-green-900 font-mono">{inputCode}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!result.valid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600 text-center">
                        Este código não corresponde a nenhum certificado válido em nossa base de dados.
                        Verifique se o código foi digitado corretamente.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Section */}
          <Card className="bg-muted/50">
            <CardContent className="py-6">
              <h4 className="font-semibold mb-2">Onde encontro o código?</h4>
              <p className="text-sm text-muted-foreground">
                O código de verificação está localizado no rodapé do seu certificado, 
                próximo ao QR Code. Ele geralmente começa com as letras do evento seguidas 
                de números e letras aleatórias.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VerificarCertificado;