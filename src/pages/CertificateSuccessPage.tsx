import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Share2, ArrowLeft, Mail } from 'lucide-react';
import CertificatePreview from '@/components/admin/certificates/CertificatePreview';
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
  const state = location.state as LocationState | null;

  // Se não há dados de estado válidos, exibe mensagem amigável em vez de tela em branco
  if (!state || !state.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-red flex items-center justify-center">
        <Card className="w-full max-w-md bg-white shadow-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Nenhum certificado encontrado</h1>
          <p className="text-sm text-gray-600">
            Para acessar esta página, primeiro valide sua participação na tela de emissão de certificados.
          </p>
          <Button
            onClick={() => navigate('/certificado-emissao')}
            className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white font-semibold mt-2"
          >
            Ir para emissão de certificado
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
    ? '✓ Certificado aprovado com participação completa!'
    : '✓ Certificado aprovado com participação parcial!';
  
  const statusDetails = isComplete
    ? 'Você acertou todas as palavras-chave e atingiu o mínimo necessário para receber o certificado.'
    : `Você acertou ${state.matched} de 3 palavras-chave, atingindo o mínimo necessário para receber o certificado.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-civeni-blue to-civeni-red">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-7xl mx-auto">
          
          {/* Coluna Esquerda - Mensagem de sucesso + Certificado */}
          <div className="text-white space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                Parabéns por ter chegado ao final do evento!
              </h1>
              <p className="text-lg text-white/90 mb-6">
                Agora é hora de emitir seu certificado!
              </p>
            </div>

            <div className="space-y-3">
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

          {/* Preview do Certificado Real */}
          <div className="mt-8 transform -rotate-2 hover:rotate-0 transition-transform duration-300">
            <CertificatePreview
              layoutConfig={{
                background: {
                  type: 'solid',
                  color: '#ffffff'
                },
                border: {
                  enabled: true,
                  style: 'single',
                  thickness: 2,
                  gradient: {
                    from: '#021b3a',
                    to: '#c51d3b'
                  }
                },
                header: {
                  showLogo: true,
                  title: 'CERTIFICADO',
                  titleColor: '#021b3a',
                  subtitle: 'III CIVENI 2025 – Celebration, Florida/EUA',
                  subtitleColor: '#666666'
                },
                body: {
                  certifyLabel: 'Certificamos que',
                  certifyLabelColor: '#c51d3b',
                  participantNamePlaceholder: '{{nome_participante}}',
                  participantNameStyle: {
                    fontSize: 32,
                    fontWeight: 'bold',
                    color: '#021b3a'
                  },
                  mainText: 'participou do {{nome_evento}}, realizado de {{data_evento}}, com carga horária de {{carga_horaria}}.',
                  mainTextColor: '#333333',
                  alignment: 'center'
                },
                footer: {
                  locationDateText: 'Celebration, Florida, {{data_emissao}}',
                  locationDateColor: '#666666',
                  signatures: [
                    {
                      label: 'Coordenação do Evento',
                      name: '{{nome_coordenador}}'
                    },
                    {
                      label: 'Direção Acadêmica',
                      name: '{{nome_reitor}}'
                    }
                  ]
                },
                badge: {
                  enabled: false,
                  position: 'top-right',
                  text: '',
                  backgroundGradient: {
                    from: '#021b3a',
                    to: '#c51d3b'
                  },
                  textColor: '#ffffff'
                }
              }}
              sampleData={{
                nome_participante: state.fullName || '[SEU NOME AQUI]',
                tipo_participacao: 'Participante',
                nome_evento: 'III CIVENI 2025',
                data_evento: '11 a 13 de dezembro de 2025',
                carga_horaria: '20 horas',
                data_emissao: '14 de dezembro de 2025',
                nome_reitor: 'Dra. Maria Silva',
                nome_coordenador: 'Dr. João Santos'
              }}
              scale={0.7}
            />
          </div>
          </div>

          {/* Coluna Direita - Card de Sucesso */}
          <div className="flex justify-center lg:justify-start">
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
                    Seu certificado está pronto!
                  </h2>
                  {state.code && (
                    <p className="text-xs text-gray-500 font-mono">
                      Código: {state.code}
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
                        📧 E-mail enviado com sucesso!
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Verifique sua caixa de entrada em <span className="font-semibold">{state.email}</span>
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
                    BAIXAR CERTIFICADO EM PDF
                  </Button>

                  <Button
                    onClick={handleAddToLinkedIn}
                    className="w-full bg-[#0077B5] hover:bg-[#006399] text-white font-semibold py-6 text-base shadow-md"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    ADICIONAR AO LINKEDIN
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Botão Voltar para a Home - Centralizado */}
        <div className="mt-8 text-center pb-8">
          <Button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:from-civeni-blue/90 hover:to-civeni-red/90 text-white px-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CertificateSuccessPage;
