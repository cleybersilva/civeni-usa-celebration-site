
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCiveniProgramData } from '@/hooks/useCiveniProgramData';
import DayTabs from '@/components/civeni/DayTabs';
import DayTimeline from '@/components/civeni/DayTimeline';
import { Tabs } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const ScheduleInPerson = () => {
  const { settings, days, isLoading, getSessionsForDay } = useCiveniProgramData();
  const [activeDay, setActiveDay] = useState<string>('');

  // Set first day as active when data loads
  React.useEffect(() => {
    if (days && days.length > 0 && !activeDay) {
      setActiveDay(days[0].id);
    }
  }, [days, activeDay]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const generatePDF = async () => {
    try {
      setIsGeneratingPdf(true);
      console.log('Iniciando geração de PDF...');
      
      const response = await fetch(`https://wdkeqxfglmritghmakma.supabase.co/functions/v1/generate-programacao-pdf?modalidade=presencial&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indka2VxeGZnbG1yaXRnaG1ha21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc0ODksImV4cCI6MjA2NTgyMzQ4OX0.h-HiLfyMh2EaYWQro1TvCVROwHnOJDyynsUIptmhKuo`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error(`Erro ao gerar PDF: ${response.status}`);
      }

      const html = await response.text();
      console.log('HTML recebido, tamanho:', html.length);
      
      if (!html || html.length < 100) {
        throw new Error('HTML vazio ou inválido recebido');
      }
      
      // Open HTML in new window that can be printed as PDF
      const newWindow = window.open('', '_blank');
      
      if (!newWindow) {
        toast({
          title: "Pop-up bloqueado",
          description: "Por favor, permita pop-ups para este site e tente novamente.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Nova janela aberta, escrevendo HTML...');
      newWindow.document.write(html);
      newWindow.document.close();
      
      // Add print functionality
      setTimeout(() => {
        console.log('Iniciando impressão...');
        newWindow.print();
      }, 1000);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "Abra a nova janela e use Ctrl+P (ou Cmd+P) para imprimir/salvar como PDF.",
      });
      
    } catch (error) {
      console.error('Erro completo ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error instanceof Error ? error.message : "Não foi possível gerar o PDF agora. Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li><Link to="/programacao-presencial" className="hover:text-blue-200 transition-colors">Programação</Link></li>
              <li className="text-blue-200">›</li>
              <li>Presencial</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 font-poppins">
              {settings?.page_title || 'Programação Presencial'}
            </h1>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto text-blue-100">
              {settings?.page_subtitle || 'Confira toda a programação presencial do III CIVENI 2025'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/inscricoes" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Fazer Inscrição
                </button>
              </Link>
              
              <button 
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    Baixar Programação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando programação...</p>
            </div>
          ) : !days || days.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Programação em breve
              </h2>
              <p className="text-gray-600">
                A programação ainda não foi publicada. Volte em breve!
              </p>
            </div>
          ) : (
            <Tabs value={activeDay} onValueChange={setActiveDay}>
              <DayTabs 
                days={days} 
                activeDay={activeDay} 
                onDayChange={setActiveDay} 
              />
              
              {days.map(day => (
                <DayTimeline
                  key={day.id}
                  day={day}
                  sessions={getSessionsForDay(day.id)}
                />
              ))}
            </Tabs>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ScheduleInPerson;
