import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const state = location.state as LocationState | null;

  // Se não há dados de estado válidos, exibe mensagem amigável em vez de tela em branco
  if (!state || !state.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-red flex items-center justify-center">
        <Card className="w-full max-w-md bg-white shadow-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('certificateSuccess.noCertificateFound')}</h1>
          <p className="text-sm text-gray-600">
            {t('certificateSuccess.noCertificateDescription')}
          </p>
          <Button
            onClick={() => navigate('/certificado-emissao')}
            className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white font-semibold mt-2"
          >
            {t('certificateSuccess.goToEmission')}
          </Button>
        </Card>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    if (state.pdfUrl) {
      window.open(state.pdfUrl, '_blank');
    }
  };

  const handleAddToLinkedIn = () => {
    const eventTitle = state.eventName || 'III CIVENI 2025 – Celebration/Florida-EUA';
    const organizationName = 'Veni Creator Christian University (VCCU)';
    const issueDate = new Date();
    
    // Construir URL com parâmetros corretos para LinkedIn
    const baseUrl = 'https://www.linkedin.com/profile/add';
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: eventTitle,
      organizationName: organizationName,
      issueYear: issueDate.getFullYear().toString(),
      issueMonth: (issueDate.getMonth() + 1).toString(),
      certUrl: state.pdfUrl || `${window.location.origin}/certificados/verify/${state.code}`,
      certId: state.code || ''
    });

    window.open(`${baseUrl}?${params.toString()}`, '_blank');
  };

  // Determinar mensagem baseada em palavras-chave
  const isComplete = state.matched === 3;
  const statusMessage = isComplete
    ? t('certificateSuccess.approvedComplete')
    : t('certificateSuccess.approvedPartial');
  
  const statusDetails = isComplete
    ? t('certificateSuccess.completeDetails')
    : t('certificateSuccess.partialDetails', { matched: state.matched });

  return (
    <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-red">
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-7xl w-full">
          
          {/* Coluna Esquerda - Mensagem de sucesso */}
          <div className="text-white space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {t('certificateEmission.pageTitle')}
              </h1>
              <p className="text-xl text-white/90 mb-8">
                {t('certificateEmission.pageSubtitle')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                <span>{t('certificateEmission.shareLinkedIn')}</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                <span>{t('certificateEmission.followCiveni')}</span>
              </div>
              <div className="flex items-center space-x-3 text-white/90">
                <div className="w-2 h-2 bg-civeni-green rounded-full"></div>
                <span>
                  {t('certificateEmission.nextEvents')}
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
                  <div className="text-sm text-gray-600 mb-4">{t('certificateEmission.certificateTitle')}</div>
                  <div className="text-xs text-gray-500 mb-6">VCCU/Civeni</div>
                  
                  <div className="border-t border-b border-gray-200 py-4 mb-4">
                    <div className="text-xs text-gray-600 mb-1">{t('certificateEmission.certifyThat')}</div>
                    <div className="font-bold text-gray-800">{state.fullName || t('certificateEmission.yourNameHere')}</div>
                    <div className="text-xs text-gray-600 mt-1">{t('certificateEmission.participatedEvent')}</div>
                  </div>
                  
                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <div className="w-16 h-8 bg-civeni-blue/10 rounded mb-1"></div>
                      <div className="text-gray-500">{t('certificateEmission.signature')}</div>
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
                size="lg"
                className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white px-8"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('certificateEmission.backToHome')}
              </Button>
            </div>
          </div>

          {/* Coluna Direita - Card de Sucesso */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-white shadow-2xl">
              <div className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white rounded-t-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <img src={civeniLogo} alt="CIVENI" className="h-12 w-auto mb-2" />
                    <p className="text-white/90 text-sm">VCCU/Civeni</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-white text-civeni-blue px-3 py-1 rounded font-bold text-xs">
                      VCCU/Civeni
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Título */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {t('certificateSuccess.certificateReady')}
                  </h2>
                  {state.code && (
                    <p className="text-xs text-gray-500 font-mono">
                      {t('certificateSuccess.code')}: {state.code}
                    </p>
                  )}
                </div>

                {/* Status - Aprovado */}
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <div className="flex items-start space-x-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {statusMessage}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {statusDetails}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Enviado */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-blue-900">
                        {t('certificateSuccess.emailSent')}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {t('certificateSuccess.checkInbox')} <span className="font-semibold">{state.email}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleDownloadPDF}
                    className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white font-bold py-6 text-base shadow-lg"
                    disabled={!state.pdfUrl}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {t('certificateSuccess.downloadPdf')}
                  </Button>

                  <Button
                    onClick={handleAddToLinkedIn}
                    className="w-full bg-[#0077B5] hover:bg-[#006399] text-white font-semibold py-6 text-base shadow-md"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    {t('certificateSuccess.addToLinkedIn')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateSuccessPage;