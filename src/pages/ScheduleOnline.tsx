
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calendar, Clock, Globe, User, Info, Play, Video, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const ScheduleOnline = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', 'online'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('type', 'online')
        .eq('is_published', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const uniqueDates = [...new Set(schedules?.map(s => s.date))].sort();
  const categories = ['palestra', 'workshop', 'painel', 'intervalo', 'credenciamento'];

  const filteredSchedules = schedules?.filter(schedule => {
    const dateMatch = !selectedDate || schedule.date === selectedDate;
    const categoryMatch = !selectedCategory || schedule.category === selectedCategory;
    return dateMatch && categoryMatch;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      palestra: 'bg-blue-500',
      workshop: 'bg-green-500',
      painel: 'bg-purple-500',
      intervalo: 'bg-orange-500',
      credenciamento: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const isLive = (date: string, startTime: string, endTime: string) => {
    const now = new Date();
    const scheduleDate = new Date(date + 'T' + startTime);
    const endDate = new Date(date + 'T' + endTime);
    return now >= scheduleDate && now <= endDate;
  };

  const isPast = (date: string, endTime: string) => {
    const now = new Date();
    const endDate = new Date(date + 'T' + endTime);
    return now > endDate;
  };

  const downloadSchedule = () => {
    const scheduleData = filteredSchedules?.map(schedule => ({
      data: formatDate(schedule.date),
      horario: `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`,
      titulo: schedule.title,
      categoria: schedule.category,
      palestrante: schedule.speaker_name || '',
      plataforma: schedule.platform || '',
      link: schedule.virtual_link || '',
      descricao: schedule.description || ''
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Data,Horário,Título,Categoria,Palestrante,Plataforma,Link,Descrição\n"
      + scheduleData?.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cronograma_online.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pt-20">
        <div className="w-full">
          <div className="text-center mb-8 px-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cronograma - Online
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Grade específica de atividades para os participantes remotos do III Civeni USA 2025
            </p>
          </div>

          {/* Filtros */}
          <div className="mb-8 flex flex-wrap gap-4 justify-center px-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDate === '' ? 'default' : 'outline'}
                onClick={() => setSelectedDate('')}
                size="sm"
              >
                Todas as Datas
              </Button>
              {uniqueDates.map(date => (
                <Button
                  key={date}
                  variant={selectedDate === date ? 'default' : 'outline'}
                  onClick={() => setSelectedDate(date)}
                  size="sm"
                >
                  {formatDate(date)}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('')}
                size="sm"
              >
                Todas as Categorias
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>

            <Button onClick={downloadSchedule} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Cronograma
            </Button>
          </div>

          {/* Cronograma */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando cronograma...</p>
            </div>
          ) : (
            <div className="space-y-6 px-4">
              {uniqueDates.map(date => {
                const daySchedules = filteredSchedules?.filter(s => s.date === date);
                if (!daySchedules?.length) return null;

                return (
                  <div key={date} className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                      <Calendar className="mr-2" />
                      {formatDate(date)}
                    </h2>
                    
                    <div className="grid gap-4">
                      {daySchedules.map(schedule => {
                        const live = isLive(schedule.date, schedule.start_time, schedule.end_time);
                        const past = isPast(schedule.date, schedule.end_time);
                        
                        return (
                          <Card key={schedule.id} className={`hover:shadow-lg transition-shadow ${live ? 'border-red-500 border-2' : ''}`}>
                            <CardHeader className="pb-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="font-semibold text-blue-600">
                                      {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                    </span>
                                    <Badge className={`${getCategoryColor(schedule.category)} text-white`}>
                                      {schedule.category}
                                    </Badge>
                                    {live && (
                                      <Badge className="bg-red-500 text-white animate-pulse">
                                        AO VIVO
                                      </Badge>
                                    )}
                                  </div>
                                  <CardTitle className="text-xl mb-2">{schedule.title}</CardTitle>
                                  
                                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                                    {schedule.speaker_name && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        <span>{schedule.speaker_name}</span>
                                      </div>
                                    )}
                                    {schedule.platform && (
                                      <div className="flex items-center gap-1">
                                        <Globe className="w-4 h-4" />
                                        <span>{schedule.platform}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    {schedule.virtual_link && (
                                      <Button
                                        asChild
                                        variant={live ? 'default' : 'outline'}
                                        size="sm"
                                        className={live ? 'bg-red-500 hover:bg-red-600' : ''}
                                      >
                                        <a href={schedule.virtual_link} target="_blank" rel="noopener noreferrer">
                                          <Play className="w-4 h-4 mr-1" />
                                          {live ? 'Assistir Agora' : 'Acessar Sala'}
                                        </a>
                                      </Button>
                                    )}
                                    
                                    {past && schedule.is_recorded && schedule.recording_url && (
                                      <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                      >
                                        <a href={schedule.recording_url} target="_blank" rel="noopener noreferrer">
                                          <Video className="w-4 h-4 mr-1" />
                                          Ver Gravação
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                
                                {schedule.speaker_photo_url && (
                                  <img
                                    src={schedule.speaker_photo_url}
                                    alt={schedule.speaker_name}
                                    className="w-12 h-12 rounded-full object-cover ml-4"
                                  />
                                )}
                              </div>
                            </CardHeader>
                            
                            {schedule.description && (
                              <CardContent className="pt-0">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Info className="w-4 h-4 mr-1" />
                                      + info
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>{schedule.title}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-4 h-4" />
                                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                        </div>
                                        {schedule.speaker_name && (
                                          <div className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {schedule.speaker_name}
                                          </div>
                                        )}
                                        {schedule.platform && (
                                          <div className="flex items-center gap-1">
                                            <Globe className="w-4 h-4" />
                                            {schedule.platform}
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-gray-700 leading-relaxed">
                                        {schedule.description}
                                      </p>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {!filteredSchedules?.length && (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Nenhuma atividade encontrada
                  </h3>
                  <p className="text-gray-500">
                    Ajuste os filtros ou volte mais tarde para ver a programação.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ScheduleOnline;
