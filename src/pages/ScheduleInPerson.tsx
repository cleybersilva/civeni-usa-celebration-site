
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
      
      const response = await fetch(`https://wdkeqxfglmritghmakma.supabase.co/functions/v1/generate-programacao-pdf?modalidade=presencial`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indka2VxeGZnbG1yaXRnaG1ha21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNDc0ODksImV4cCI6MjA2NTgyMzQ4OX0.h-HiLfyMh2EaYWQro1TvCVROwHnOJDyynsUIptmhKuo`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `civeni-programacao-presencial-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: "O download da programação foi iniciado.",
      });
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF agora. Tente novamente em instantes.",
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
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              {settings?.page_title || 'Programação Presencial'}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              {settings?.page_subtitle || 'Confira toda a programação presencial do III CIVENI 2025'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/inscricoes">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
              
              <button 
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
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
