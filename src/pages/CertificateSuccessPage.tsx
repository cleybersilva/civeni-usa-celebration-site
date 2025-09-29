import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Share2, ArrowLeft, Mail } from 'lucide-react';
import civeniLogo from '@/assets/civeni-2025-logo.png';

interface LocationState {
  success: boolean;
  message: string;
  pdfUrl?: string;
  code?: string;
  matched?: number;
  fullName?: string;
  email?: string;
  eventName?: string;
}

const CertificateSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // Se não há dados de estado, redirecionar para emissão
  if (!state || !state.success) {
    navigate('/certificado-emissao');
    return null;
  }

  const handleDownloadPDF = () => {
    if (state.pdfUrl) {
      window.open(state.pdfUrl, '_blank');
    }
  };

  const handleAddToLinkedIn = () => {
    // Construir URL do LinkedIn para adicionar certificação
    const linkedInUrl = new URLSearchParams({
      name: state.eventName || 'CIVENI 2025',
      organizationId: '', // Adicionar ID da organização se disponível
      issueYear: new Date().getFullYear().toString(),
      issueMonth: (new Date().getMonth() + 1).toString(),
      certUrl: state.pdfUrl || window.location.href,
      certId: state.code || ''
    });

    window.open(
      `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&${linkedInUrl.toString()}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-red">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-7xl w-full">
          
          {/* Coluna Esquerda - Mensagem de sucesso */}
          <div className="text-white space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Parabéns por ter chegado ao final da aula!
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
                  <div className="text-xs text-gray-500 mb-6">VCCU/Civeni</div>
                  
                  <div className="border-t border-b border-gray-200 py-4 mb-4">
                    <div className="text-xs text-gray-600 mb-1">Certificamos que</div>
                    <div className="font-bold text-gray-800">{state.fullName || '[SEU NOME]'}</div>
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

            {/* Botão Voltar */}
            <div className="mt-8 text-center">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para a Home
              </Button>
            </div>
          </div>

          {/* Coluna Direita - Card de Sucesso */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-white shadow-2xl">
              <div className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white rounded-t-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Emita seu certificado</h2>
                    <p className="text-white/90 text-sm">{state.eventName || 'VCCU/Civeni'}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-white text-civeni-blue px-3 py-1 rounded font-bold text-sm">
                      VCCU/Civeni
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Certificado Aprovado */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-gray-800">
                      ✓ Certificado aprovado com participação parcial
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 pl-8">
                    Você acertou {state.matched || 0} de 5 palavras-chave, 
                    atingindo o mínimo necessário para receber o certificado.
                  </p>
                </div>

                {/* Email Enviado */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    E-mail enviado com sucesso!
                  </p>
                  <p className="text-xs text-blue-700">
                    Verifique sua caixa de entrada em{' '}
                    <span className="font-semibold">{state.email}</span>
                  </p>
                </div>

                {/* Certificado Pronto */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Seu certificado está pronto!
                  </h3>
                  {state.code && (
                    <p className="text-xs text-gray-600">
                      Código de verificação: <span className="font-mono font-semibold">{state.code}</span>
                    </p>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3">
                  <Button
                    onClick={handleDownloadPDF}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-base"
                    disabled={!state.pdfUrl}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    BAIXAR CERTIFICADO EM PDF
                  </Button>

                  <Button
                    onClick={handleAddToLinkedIn}
                    className="w-full bg-[#0077B5] hover:bg-[#006399] text-white font-bold py-6 text-base"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    ADICIONAR AO LINKEDIN
                  </Button>
                </div>

                {/* Mensagem de Sucesso */}
                {state.message && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-gray-600 italic">
                      {state.message}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateSuccessPage;
