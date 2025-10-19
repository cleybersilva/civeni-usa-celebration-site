import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Youtube, Calendar, HelpCircle, Users, Clock, MapPin, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DynamicLivePlayer from '@/components/transmission/DynamicLivePlayer';
import { useTransmissionSchedule, useTransmissionFAQ, useUpcomingStreams } from '@/hooks/useTransmissionStreamData';

const TransmissaoAoVivo = () => {
  const { t, i18n } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);

  const { data: schedule, isLoading: scheduleLoading } = useTransmissionSchedule(selectedDay);
  const { data: faqItems, isLoading: faqLoading } = useTransmissionFAQ();
  const { data: upcomingStreams, isLoading: upcomingLoading } = useUpcomingStreams(3);

  const getLocalized = (obj: Record<string, string> | undefined) => {
    if (!obj) return '';
    return obj[i18n.language] || obj.pt || '';
  };

  const formatDateTime = (dateStr: string, timeStr?: string | null) => {
    const date = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    return date.toLocaleString(i18n.language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModalityBadge = (modality: string) => {
    const colors = {
      online: 'bg-blue-100 text-blue-800',
      presencial: 'bg-green-100 text-green-800',
      hibrido: 'bg-purple-100 text-purple-800'
    };
    return colors[modality as keyof typeof colors] || colors.hibrido;
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <title>{t('events.transmission.pageTitle')} | CIVENI 2025</title>
      <meta name="description" content={t('events.transmission.pageDescription')} />
      <meta property="og:title" content={`${t('events.transmission.pageTitle')} | CIVENI 2025`} />
      <meta property="og:description" content={t('events.transmission.pageDescription')} />
      <meta property="og:type" content="website" />
      
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
                <li>{t('events.transmission.title')}</li>
              </ol>
            </nav>
            
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                {t('events.transmission.subtitle')}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
                {t('events.transmission.title')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
                {t('events.transmission.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/inscricoes">
                  <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('registration.title')}
                  </button>
                </Link>
                
                <a href="https://youtube.com/@CiveniUSA2025" target="_blank" rel="noopener noreferrer">
                  <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                    <Youtube className="w-5 h-5" />
                    {t('events.transmission.ctaWatch')}
                  </button>
                </a>
              </div>
              
              <p className="text-sm text-blue-100 pt-6">
                {t('events.transmission.timezoneInfo')}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="py-20" id="live-section">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="live" className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="live" className="gap-2">
                  <Youtube className="w-4 h-4" />
                  {t('events.transmission.tabs.live')}
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('events.transmission.tabs.schedule')}
                </TabsTrigger>
                <TabsTrigger value="faq" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  {t('events.transmission.tabs.faq')}
                </TabsTrigger>
              </TabsList>

              {/* Live Tab */}
              <TabsContent value="live" className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <DynamicLivePlayer />
                  </div>
                  
                  {/* Upcoming Streams */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{t('events.transmission.upcomingStreams')}</h3>
                    {upcomingLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                        ))}
                      </div>
                    ) : upcomingStreams && upcomingStreams.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingStreams.map((stream) => (
                          <Card key={stream.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight flex-1">
                                {getLocalized(stream.title)}
                              </h4>
                              {stream.scheduled_date && (
                                <Badge variant="outline" className="text-xs">
                                  {formatDateTime(stream.scheduled_date)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {getLocalized(stream.description)}
                            </p>
                            <Button size="sm" variant="ghost" className="w-full text-xs gap-2">
                              <Youtube className="w-3 h-3" />
                              {t('events.transmission.setReminder')}
                            </Button>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-6 text-center text-muted-foreground">
                        <p className="text-sm">{t('events.transmission.noUpcoming')}</p>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={selectedDay === undefined ? 'default' : 'outline'}
                      onClick={() => setSelectedDay(undefined)}
                    >
                      {t('events.transmission.all')}
                    </Button>
                    {[1, 2, 3].map((day) => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? 'default' : 'outline'}
                        onClick={() => setSelectedDay(day)}
                      >
                        {t('events.transmission.day')} {day}
                      </Button>
                    ))}
                  </div>
                </div>

                {scheduleLoading ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : schedule && schedule.length > 0 ? (
                  <div className="grid gap-4">
                    {schedule.map((item) => (
                      <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-shrink-0">
                            <Badge className={getModalityBadge(item.modality)}>
                              {item.modality.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              {getLocalized(item.topic)}
                            </h3>
                            
                            {item.speaker && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {item.speaker}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(item.start_time)}
                                {item.end_time && ` - ${formatTime(item.end_time)}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(item.date).toLocaleDateString(i18n.language, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>

                            {item.meet_room_link && (
                              <Button size="sm" variant="outline" className="gap-2" asChild>
                                <a href={item.meet_room_link} target="_blank" rel="noopener noreferrer">
                                  <MapPin className="w-4 h-4" />
                                  {t('events.transmission.joinRoom')}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">{t('events.transmission.noSessions')}</p>
                  </Card>
                )}
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq">
                <Card className="p-8">
                  {faqLoading ? (
                    <div className="space-y-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
                          <div className="h-16 bg-muted animate-pulse rounded" />
                        </div>
                      ))}
                    </div>
                  ) : faqItems && faqItems.length > 0 ? (
                    <div className="prose dark:prose-invert max-w-none space-y-6">
                      <h2 className="text-3xl font-bold mb-8">{t('events.transmission.faqTitle')}</h2>
                      
                      {faqItems.map((item) => (
                        <div key={item.id} className="border-b border-gray-200 pb-6 last:border-0">
                          <h3 className="text-xl font-semibold text-gray-900 mb-3">
                            {getLocalized(item.question)}
                          </h3>
                          <p className="text-gray-700 leading-relaxed">
                            {getLocalized(item.answer)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma pergunta frequente cadastrada ainda.</p>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default TransmissaoAoVivo;
