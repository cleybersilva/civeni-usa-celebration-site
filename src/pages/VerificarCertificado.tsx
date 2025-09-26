import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const VerificarCertificado = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    valid: boolean;
    message: string;
    holderName?: string;
    eventSlug?: string;
    issuedAt?: string;
  } | null>(null);

  useEffect(() => {
    const verifyCode = async () => {
      if (!code) {
        setResult({
          valid: false,
          message: 'Código não fornecido'
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-certificate', {
          body: { code }
        });

        if (error) throw error;

        setResult(data);
      } catch (error) {
        setResult({
          valid: false,
          message: 'Erro ao verificar certificado'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyCode();
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Verificação de Certificado</CardTitle>
            </CardHeader>
            
            <CardContent className="py-8">
              {loading ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Verificando certificado...</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    {result.valid ? (
                      <CheckCircle className="h-16 w-16 text-green-600" />
                    ) : (
                      <XCircle className="h-16 w-16 text-red-600" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className={`text-xl font-semibold ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                      {result.valid ? 'Certificado Válido' : 'Certificado Inválido'}
                    </h3>
                    <p className="text-muted-foreground mt-2">{result.message}</p>
                  </div>
                  
                  {result.valid && result.holderName && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-left">
                      <h4 className="font-semibold text-green-800 mb-3">Detalhes do Certificado</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Portador:</strong> {result.holderName}</div>
                        <div><strong>Evento:</strong> {result.eventSlug}</div>
                        <div><strong>Data de Emissão:</strong> {result.issuedAt ? new Date(result.issuedAt).toLocaleDateString('pt-BR') : 'N/A'}</div>
                        <div><strong>Código:</strong> {code}</div>
                      </div>
                    </div>
                  )}
                  
                  {!result.valid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">
                        Este código não corresponde a nenhum certificado válido em nossa base de dados.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default VerificarCertificado;