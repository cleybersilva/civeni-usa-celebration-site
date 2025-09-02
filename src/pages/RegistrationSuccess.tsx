import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const RegistrationSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });
    } catch (error) {
      console.error('Payment verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-civeni-blue">
                🎉 Inscrição Realizada com Sucesso!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700">
                Parabéns! Sua inscrição no Civeni 2025 foi confirmada.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Mail className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-700">
                  Você receberá confirmação por e-mail, WhatsApp e SMS em breve.
                </p>
              </div>

              <Button asChild className="bg-civeni-blue hover:bg-blue-700">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;