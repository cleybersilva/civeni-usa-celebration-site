import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RegistrationCanceled = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-orange-500" />
              </div>
              <CardTitle className="text-2xl text-civeni-blue">
                Inscrição Cancelada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-gray-700">
                Sua inscrição foi cancelada e nenhum pagamento foi processado.
              </p>

              <div className="flex gap-4 justify-center">
                <Button asChild className="bg-civeni-red hover:bg-red-700">
                  <Link to="/#registration">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Link>
                </Button>
                <Button variant="outline" asChild>
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

export default RegistrationCanceled;