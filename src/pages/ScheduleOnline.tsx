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
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <Header />
        
        {/* Hero Section - Premium Design */}
        <section className="relative bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground py-16 md:py-24 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[url('/assets/conference-event.jpg')] bg-cover bg-center opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-transparent"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
            {/* Breadcrumbs */}
            <nav className="mb-6 md:mb-8 text-xs sm:text-sm">
              <ol className="flex items-center space-x-2 flex-wrap">
                <li><Link to="/" className="hover:text-primary-foreground/80 transition-colors">Home</Link></li>
                <li className="text-primary-foreground/60">›</li>
                <li><Link to="/programacao-online" className="hover:text-primary-foreground/80 transition-colors">Programação</Link></li>
                <li className="text-primary-foreground/60">›</li>
                <li className="font-medium">Online</li>
              </ol>
            </nav>
            
            <div className="text-center max-w-5xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full mb-4 md:mb-6">
                <Calendar className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">III CIVENI 2025 - Acesse de qualquer lugar</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                {settings?.page_title || 'Programação Online'}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 md:mb-10 max-w-3xl mx-auto text-primary-foreground/90 leading-relaxed">
                {settings?.page_subtitle || 'Confira toda a programação online do III CIVENI 2025 - Acesse de qualquer lugar do mundo'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                <Link to="/inscricoes" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-background text-foreground hover:bg-background/90 px-6 md:px-8 py-3 md:py-3.5 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105">
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Fazer Inscrição</span>
                  </button>
                </Link>
                
                <button 
                  onClick={generatePDF}
                  className="w-full sm:w-auto border-2 border-primary-foreground/30 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/20 px-6 md:px-8 py-3 md:py-3.5 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Baixar Programação</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-16">
            <svg className="w-full h-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="hsl(var(--background))" fillOpacity="1"/>
            </svg>
          </div>
        </section>
        
        {/* Main Content */}
        <main className="py-12 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Intro Section */}
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Selecione o dia para ver a programação completa
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
                Acompanhe todas as palestras, workshops e atividades online. Horários em GMT-3 (Fortaleza/CE).
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground text-sm md:text-base">Carregando programação...</p>
              </div>
            ) : !days || days.length === 0 ? (
              <div className="text-center py-16 md:py-24">
                <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12 max-w-2xl mx-auto border border-border">
                  <Calendar className="w-16 h-16 md:w-20 md:h-20 mx-auto text-muted-foreground/50 mb-6" />
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    Programação em breve
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    A programação online ainda não foi publicada. Volte em breve!
                  </p>
                </div>
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