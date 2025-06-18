
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RegistrationSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentStatus('success');
      } else {
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('error');
    }
  };

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-civeni-blue mx-auto mb-4"></div>
          <p className="text-lg">{t('registration.verifyingPayment')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              {paymentStatus === 'success' ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-600 mb-2">
                    {t('registration.success.title')}
                  </CardTitle>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl text-red-600 mb-2">
                    {t('registration.error.title')}
                  </CardTitle>
                </>
              )}
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {paymentStatus === 'success' ? (
                <>
                  <p className="text-lg text-gray-700">
                    {t('registration.success.message')}
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-civeni-blue" />
                      <span className="font-semibold">{t('registration.success.emailSent')}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('registration.success.checkEmail')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{t('registration.success.nextSteps')}</h3>
                    <ul className="text-left space-y-1 text-gray-700">
                      <li>• {t('registration.success.step1')}</li>
                      <li>• {t('registration.success.step2')}</li>
                      <li>• {t('registration.success.step3')}</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-lg text-gray-700">
                  {t('registration.error.message')}
                </p>
              )}
              
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {t('common.backToHome')}
                  </Link>
                </Button>
                {paymentStatus === 'error' && (
                  <Button asChild variant="outline">
                    <Link to="/#registration">
                      {t('registration.tryAgain')}
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
