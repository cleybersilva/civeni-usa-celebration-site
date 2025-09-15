
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Monitor, Users, Download } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScheduleFilters from '@/components/schedule/ScheduleFilters';
import ScheduleOnlineDay from '@/components/schedule/ScheduleOnlineDay';
import ScheduleEmpty from '@/components/schedule/ScheduleEmpty';
import { useScheduleData } from '@/hooks/useScheduleData';
import { downloadSchedule } from '@/utils/scheduleUtils';
import { useTranslation } from 'react-i18next';

const ScheduleOnline = () => {
  const { t } = useTranslation();
  const {
    isLoading,
    selectedDate,
    setSelectedDate,
    selectedCategory,
    setSelectedCategory,
    uniqueDates,
    categories,
    filteredSchedules,
  } = useScheduleData('online');

  const handleDownload = () => {
    downloadSchedule(filteredSchedules, 'online');
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
              <li><Link to="/programacao-online" className="hover:text-blue-200 transition-colors">Programação</Link></li>
              <li className="text-blue-200">›</li>
              <li>Online</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              Programação Online
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Participe do III CIVENI 2025 de qualquer lugar do mundo - 
              Transmissões ao vivo, webinars interativos e experiências digitais imersivas
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/inscricoes">
                <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </Link>
              
              <button 
                onClick={handleDownload}
                className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar Programação
              </button>
            </div>
          </div>
        </div>
      </section>
      
      <main className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-poppins flex items-center justify-center gap-3">
              <Monitor className="w-8 h-8 text-civeni-blue" />
              Cronograma das Atividades Online
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Acesse todas as transmissões ao vivo e atividades interativas do congresso de onde estiver
            </p>
          </div>

          <ScheduleFilters
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            uniqueDates={uniqueDates}
            categories={categories}
            onDownload={handleDownload}
          />

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('schedule.loading')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uniqueDates.map(date => {
                const daySchedules = filteredSchedules?.filter(s => s.date === date);
                if (!daySchedules?.length) return null;

                return (
                  <ScheduleOnlineDay key={date} date={date} schedules={daySchedules} />
                );
              })}
              
              {!filteredSchedules?.length && <ScheduleEmpty />}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ScheduleOnline;
