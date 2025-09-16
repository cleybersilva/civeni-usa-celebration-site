
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from 'react';
import './i18n/config';
import { CMSProvider } from './contexts/CMSContext';
import { SecurityProvider } from './components/SecurityProvider';

// Pages
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import ScheduleInPerson from "./pages/ScheduleInPerson";
import ScheduleOnline from "./pages/ScheduleOnline";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import RegistrationCanceled from "./pages/RegistrationCanceled";
import NotFound from "./pages/NotFound";
import InscricaoPresencial from "./pages/InscricaoPresencial";
import InscricaoOnline from "./pages/InscricaoOnline";
import Palestrantes from "./pages/Palestrantes";
import CongressoApresentacao from "./pages/CongressoApresentacao";
import CongressoComite from "./pages/CongressoComite";
import AreaTematica from "./pages/AreaTematica";
import Contato from "./pages/Contato";
import Inscricoes from "./pages/Inscricoes";
import PoliticasPrivacidade from "./pages/PoliticasPrivacidade";
import TransmissaoAoVivo from "./pages/TransmissaoAoVivo";
import SejaNossoParceiro from "./pages/SejaNossoParceiro";
import SubmissaoTrabalhos from "./pages/SubmissaoTrabalhos";
import ApresentacaoOral from "./pages/ApresentacaoOral";
import SessoesPoster from "./pages/SessoesPoster";
import Manuscritos from "./pages/Manuscritos";
import Sobre from "./pages/Sobre";
import Eventos from "./pages/Eventos";
import EventoDetalhesNew from "./pages/EventoDetalhesNew";

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
                {/* Keep legacy routes for backward compatibility */}
                <Route path="/cronograma-presencial" element={<ScheduleInPerson />} />
                <Route path="/cronograma-online" element={<ScheduleOnline />} />
                <Route path="/inscricao-presencial" element={<InscricaoPresencial />} />
                <Route path="/inscricao-online" element={<InscricaoOnline />} />
                <Route path="/palestrantes" element={<Palestrantes />} />
                <Route path="/area-tematica" element={<AreaTematica />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/congresso/apresentacao" element={<CongressoApresentacao />} />
                <Route path="/congresso/comite" element={<CongressoComite />} />
                <Route path="/inscricoes" element={<Inscricoes />} />
                <Route path="/politicas-de-privacidade" element={<PoliticasPrivacidade />} />
                <Route path="/transmissao-ao-vivo" element={<TransmissaoAoVivo />} />
                <Route path="/seja-nosso-parceiro" element={<SejaNossoParceiro />} />
                <Route path="/submissao-trabalhos" element={<SubmissaoTrabalhos />} />
                <Route path="/apresentacao-oral" element={<ApresentacaoOral />} />
                <Route path="/sessoes-poster" element={<SessoesPoster />} />
                <Route path="/manuscritos" element={<Manuscritos />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/eventos/:slug" element={<EventoDetalhesNew />} />
                <Route path="/registration/success" element={<RegistrationSuccess />} />
                <Route path="/registration/canceled" element={<RegistrationCanceled />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </CMSProvider>
      </SecurityProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
