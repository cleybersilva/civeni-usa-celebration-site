import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import civeniLogo from '@/assets/civeni-2025-logo.png';
import conferenceImage from '@/assets/conference-event.jpg';

const VideoSubmissionSuccess = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center py-12 px-4 bg-gradient-to-br from-civeni-blue to-civeni-red">
      <div className="absolute inset-0">
        <img 
          src={conferenceImage} 
          alt="Evento de Conferência" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      <div className="container mx-auto relative z-10">
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

              {/* Success Icon */}
              <div className="flex justify-center">
                <CheckCircle className="w-20 h-20 text-green-600" />
              </div>

              {/* Title */}
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-foreground">
                  Vídeo Enviado com Sucesso!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Parabéns! Seu vídeo foi enviado e registrado com sucesso.
                </p>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  <p className="text-center text-blue-700 font-medium">
                    Seus dados foram enviados para avaliação
                  </p>
                  <p className="text-center text-blue-600 text-sm">
                    Sua submissão será exibida no painel administrativo do CIVENI para avaliação pelos avaliadores credenciados.
                  </p>
                  <p className="text-center text-blue-600 text-sm">
                    Caso seja necessário algum ajuste ou correção, nossa equipe entrará em contato através do e-mail cadastrado.
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <p className="text-center text-green-700">
                  <strong>Próximos passos:</strong> Aguarde o retorno da equipe de avaliação. Você receberá uma notificação por e-mail assim que houver uma atualização sobre sua submissão.
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

export default VideoSubmissionSuccess;
