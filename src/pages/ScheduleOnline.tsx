import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, Users, Clock, ExternalLink, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const generatePDF = async () => {
    // Simple CSV export for now - can be enhanced to proper PDF later
    if (!days || !days.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Horário,Título,Tipo,Modalidade,Sala,Descrição\n";
    
    days.forEach(day => {
      const sessions = getSessionsForDay(day.id);
      sessions.forEach(session => {
        const startTime = new Date(session.start_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Fortaleza'
        });
        const endTime = session.end_at ? new Date(session.end_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Fortaleza'
        }) : '';
        
        csvContent += `"${day.weekday_label}, ${new Date(day.date + 'T00:00:00').toLocaleDateString('pt-BR')}","${startTime}${endTime ? ' - ' + endTime : ''}","${session.title}","${session.session_type}","${session.modality}","${session.room || ''}","${session.description || ''}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `programacao-online-civeni-2025.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
                {settings?.page_title || 'Programação Online'}
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
                {settings?.page_subtitle || 'Confira toda a programação online do III CIVENI 2025 - Acesse de qualquer lugar do mundo'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/inscricoes">
                  <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Fazer Inscrição
                  </button>
                </Link>
                
                {settings?.show_download_pdf && (
                  <button 
                    onClick={generatePDF}
                    className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Baixar Programação
                  </button>
                )}
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
    </>
  );
};

export default ScheduleOnline;