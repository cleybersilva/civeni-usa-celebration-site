import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import civeniLogo from '@/assets/civeni-2025-logo.png';

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });
      
      if (error) {
        console.error('Payment verification error:', error);
      } else {
        console.log('Payment verified successfully:', data);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-8 px-8 space-y-8">
              {/* CIVENI Logo */}
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src={civeniLogo} 
                    alt="CIVENI 2025" 
                    className="h-32 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                  🎉 Inscrição Realizada com Sucesso!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Parabéns! Sua inscrição no Civeni 2025 foi confirmada.
                </p>
              </div>
              
              {/* Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
                <div className="flex justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-center text-green-700 font-medium">
                  Você receberá confirmação por e-mail, WhatsApp e SMS em breve.
                </p>
              </div>

              {/* Back Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-[hsl(210,100%,25%)] hover:bg-[hsl(210,100%,20%)] text-white px-8"
                >
                  <Link to="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar ao Início
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;