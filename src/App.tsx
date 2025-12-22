
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import { CMSProvider } from './contexts/CMSContext';
import { SecurityProvider } from './components/SecurityProvider';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppButton from './components/WhatsAppButton';

// Pages
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import ScheduleInPerson from "./pages/ScheduleInPerson";
import ScheduleOnline from "./pages/ScheduleOnline";
import ProgramacaoImpressao from "./pages/ProgramacaoImpressao";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import RegistrationCanceled from "./pages/RegistrationCanceled";
import WorkSubmissionSuccess from "./pages/WorkSubmissionSuccess";
import VideoSubmissionSuccess from "./pages/VideoSubmissionSuccess";
import NotFound from "./pages/NotFound";
import InscricaoPresencial from "./pages/InscricaoPresencial";
import InscricaoOnline from "./pages/InscricaoOnline";
import Palestrantes from "./pages/Palestrantes";
import CongressoApresentacao from "./pages/CongressoApresentacao";
import CongressoAvaliadores from "./pages/CongressoAvaliadores";
import CongressoComite from "./pages/CongressoComite";
import AreaTematica from "./pages/AreaTematica";
import Contato from "./pages/Contato";
import Inscricoes from "./pages/Inscricoes";
import PoliticasPrivacidade from "./pages/PoliticasPrivacidade";

import SejaNossoParceiro from "./pages/SejaNossoParceiro";
import SubmissaoTrabalhos from "./pages/SubmissaoTrabalhos";
import ApresentacaoOral from "./pages/ApresentacaoOral";
import ListaApresentacao from "./pages/ListaApresentacao";
import SessoesPoster from "./pages/SessoesPoster";
import EnvioVideos from "./pages/EnvioVideos";
import TemplatesArtigosSlides from "./pages/TemplatesArtigosSlides";
import Sobre from "./pages/Sobre";
import Eventos from "./pages/Eventos";
import EventoDetalhes from "./pages/EventoDetalhes";
import CertificadoEmissao from "./pages/CertificadoEmissao";
import CertificateSuccessPage from "./pages/CertificateSuccessPage";
import VerificarCertificado from "./pages/VerificarCertificado";
import TransmissaoAoVivo from "./pages/TransmissaoAoVivo";
import TransmissaoDetalhes from "./pages/TransmissaoDetalhes";
import TransmissaoFAQ from "./pages/TransmissaoFAQ";

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <SecurityProvider>
            <CMSProvider>
              <Toaster />
              <Router>
                <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/programacao-presencial" element={<ScheduleInPerson />} />
        <Route path="/programacao-online" element={<ScheduleOnline />} />
        <Route path="/programacao/impressao" element={<ProgramacaoImpressao />} />
                {/* Keep legacy routes for backward compatibility */}
                <Route path="/cronograma-presencial" element={<ScheduleInPerson />} />
                <Route path="/cronograma-online" element={<ScheduleOnline />} />
                <Route path="/inscricao-presencial" element={<InscricaoPresencial />} />
                <Route path="/inscricao-online" element={<InscricaoOnline />} />
                <Route path="/palestrantes" element={<Palestrantes />} />
                <Route path="/area-tematica" element={<AreaTematica />} />
                <Route path="/contato" element={<Contato />} />
            <Route path="/congresso/apresentacao" element={<CongressoApresentacao />} />
            <Route path="/congresso/avaliadores" element={<CongressoAvaliadores />} />
            <Route path="/congresso/comite" element={<CongressoComite />} />
                <Route path="/inscricoes" element={<Inscricoes />} />
                <Route path="/politicas-de-privacidade" element={<PoliticasPrivacidade />} />
          <Route path="/transmissao-ao-vivo" element={<TransmissaoAoVivo />} />
          <Route path="/transmissao-ao-vivo/:slug" element={<TransmissaoDetalhes />} />
          <Route path="/transmissao-ao-vivo/faq" element={<TransmissaoFAQ />} />
                <Route path="/seja-nosso-parceiro" element={<SejaNossoParceiro />} />
                <Route path="/submissao-trabalhos" element={<SubmissaoTrabalhos />} />
                <Route path="/apresentacao-oral" element={<ApresentacaoOral />} />
                <Route path="/lista-apresentacao" element={<ListaApresentacao />} />
                <Route path="/sessoes-poster" element={<SessoesPoster />} />
                {/* Redirect /manuscritos para /envio-videos */}
                <Route path="/manuscritos" element={<Navigate to="/envio-videos" replace />} />
                <Route path="/envio-videos" element={<EnvioVideos />} />
                <Route path="/envio-de-videos" element={<Navigate to="/envio-videos" replace />} />
                <Route path="/templates-artigos-slides" element={<TemplatesArtigosSlides />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/eventos/:slug" element={<EventoDetalhes />} />
                <Route path="/eventos/:slug/certificado" element={<CertificadoEmissao />} />
                <Route path="/certificado-emissao" element={<CertificadoEmissao />} />
                <Route path="/certificado-sucesso" element={<CertificateSuccessPage />} />
                <Route path="/certificados/verify/:code" element={<VerificarCertificado />} />
                <Route path="/verificar-certificado" element={<VerificarCertificado />} />
                <Route path="/verificar-certificado/:code" element={<VerificarCertificado />} />
                <Route path="/registration/success" element={<RegistrationSuccess />} />
                <Route path="/registration/canceled" element={<RegistrationCanceled />} />
                <Route path="/work-submission/success" element={<WorkSubmissionSuccess />} />
                <Route path="/video-submission/success" element={<VideoSubmissionSuccess />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <WhatsAppButton />
              <ScrollToTop />
            </Router>
          </CMSProvider>
        </SecurityProvider>
      </TooltipProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
