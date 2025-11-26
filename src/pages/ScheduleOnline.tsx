import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs } from '@/components/ui/tabs';
import DayTabs from '@/components/civeni/DayTabs';
import DayTimeline from '@/components/civeni/DayTimeline';
import { useCiveniOnlineProgramData } from '@/hooks/useCiveniOnlineProgramData';

const ScheduleOnline = () => {
  const { settings, days, isLoading, getSessionsForDay } = useCiveniOnlineProgramData();
  const [activeDay, setActiveDay] = useState<string>('');

  // Set first day as active when data loads
  React.useEffect(() => {
    if (days && days.length > 0 && !activeDay) {
      setActiveDay(days[0].id);
    }
  }, [days, activeDay]);

  const generatePDF = () => {
    window.open('/programacao/impressao?modalidade=online', '_blank');
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <title>Programação Online - III CIVENI 2025</title>
      <meta name="description" content="Confira toda a programação online do III CIVENI 2025 - Congresso Internacional Virtual de Educação e Inovação" />
      
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
                <li><Link to="/programacao-online" className="hover:text-blue-200 transition-colors">Programação</Link></li>
                <li className="text-blue-200">›</li>
                <li>Online</li>
              </ol>
            </nav>
            
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 font-poppins">
                {settings?.page_title || 'Programação Online'}
              </h1>
              <p className="text-sm sm:text-base md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto text-blue-100">
                {settings?.page_subtitle || 'Confira toda a programação online do III CIVENI 2025 - Acesse de qualquer lugar do mundo'}
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
                  className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  Baixar Programação
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
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Programação em breve
                </h2>
                <p className="text-gray-600">
                  A programação online ainda não foi publicada. Volte em breve!
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
                  day.id === activeDay && (
                    <DayTimeline
                      key={day.id}
                      day={day}
                      sessions={getSessionsForDay(day.id)}
                    />
                  )
                ))}
              </Tabs>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ScheduleOnline;