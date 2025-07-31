
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from 'react';
import './i18n/config';
import { CMSProvider } from './contexts/CMSContext';

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
import AreaTematica from "./pages/AreaTematica";
import Contato from "./pages/Contato";
import Inscricoes from "./pages/Inscricoes";
import PoliticasPrivacidade from "./pages/PoliticasPrivacidade";
import TransmissaoAoVivo from "./pages/TransmissaoAoVivo";
import SejaNossoParceiro from "./pages/SejaNossoParceiro";
import SubmissaoTrabalhos from "./pages/SubmissaoTrabalhos";

import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CMSProvider>
          <Toaster />
          <Router>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/cronograma-presencial" element={<ScheduleInPerson />} />
                <Route path="/cronograma-online" element={<ScheduleOnline />} />
                <Route path="/inscricao-presencial" element={<InscricaoPresencial />} />
                <Route path="/inscricao-online" element={<InscricaoOnline />} />
                <Route path="/palestrantes" element={<Palestrantes />} />
                <Route path="/area-tematica" element={<AreaTematica />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/inscricoes" element={<Inscricoes />} />
                <Route path="/politicas-de-privacidade" element={<PoliticasPrivacidade />} />
                <Route path="/transmissao-ao-vivo" element={<TransmissaoAoVivo />} />
                <Route path="/seja-nosso-parceiro" element={<SejaNossoParceiro />} />
                <Route path="/submissao-trabalhos" element={<SubmissaoTrabalhos />} />
                <Route path="/registration/success" element={<RegistrationSuccess />} />
                <Route path="/registration/canceled" element={<RegistrationCanceled />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </CMSProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
