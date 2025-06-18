
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { XCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RegistrationCanceled = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-orange-600 mb-2">
                {t('registration.canceled.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-lg text-gray-700">
                {t('registration.canceled.message')}
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t('registration.canceled.noCharge')}
                </p>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <Link to="/#registration" className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    {t('registration.tryAgain')}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {t('common.backToHome')}
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

export default RegistrationCanceled;
