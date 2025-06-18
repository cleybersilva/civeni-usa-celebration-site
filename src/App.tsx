
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import RegistrationCanceled from "./pages/RegistrationCanceled";
import ScheduleInPerson from "./pages/ScheduleInPerson";
import ScheduleOnline from "./pages/ScheduleOnline";
import NotFound from "./pages/NotFound";
import { CMSProvider } from "./contexts/CMSContext";
import "./i18n/config";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CMSProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/cronograma-presencial" element={<ScheduleInPerson />} />
            <Route path="/cronograma-online" element={<ScheduleOnline />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/registration-canceled" element={<RegistrationCanceled />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CMSProvider>
  </QueryClientProvider>
);

export default App;
