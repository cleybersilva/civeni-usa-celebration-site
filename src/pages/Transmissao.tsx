import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Youtube, Calendar, Video, HelpCircle, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LivePlayer from '@/components/transmission/LivePlayer';
import SessionCard from '@/components/transmission/SessionCard';
import MeetRoomCard from '@/components/transmission/MeetRoomCard';
import { useSessions, useMeetRooms, useUpcomingStreams } from '@/hooks/useTransmissionData';

const Transmissao = () => {
  const { t, i18n } = useTranslation();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTrack, setSelectedTrack] = useState<'online' | 'presencial' | 'all'>('all');

  const { data: sessions, isLoading: sessionsLoading } = useSessions(selectedDay, selectedTrack);
  const { data: rooms, isLoading: roomsLoading } = useMeetRooms();
  const { data: upcomingStreams } = useUpcomingStreams(3);

  const getTitle = (titleObj: Record<string, string> | undefined) => {
    if (!titleObj) return '';
    return titleObj[i18n.language] || titleObj.pt || '';
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <title>{t('transmission.pageTitle')} | CIVENI 2025</title>
      <meta name="description" content={t('transmission.pageDescription')} />
      <meta property="og:title" content={`${t('transmission.pageTitle')} | CIVENI 2025`} />
      <meta property="og:description" content={t('transmission.pageDescription')} />
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
                <li>{t('transmission.title')}</li>
              </ol>
            </nav>
            
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                {t('transmission.subtitle')}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
                {t('transmission.title')}
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
                {t('transmission.description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/inscricoes">
                  <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t('registration.title')}
                  </button>
                </Link>
                
                <a href="#live-section">
                  <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                    <Youtube className="w-5 h-5" />
                    {t('transmission.ctaWatch')}
                  </button>
                </a>
              </div>
              
              <p className="text-sm text-blue-100 pt-6">
                {t('transmission.timezoneInfo')}
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="py-20" id="live-section">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="live" className="space-y-8">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="live" className="gap-2">
                  <Youtube className="w-4 h-4" />
                  {t('transmission.tabs.live')}
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('transmission.tabs.schedule')}
                </TabsTrigger>
                <TabsTrigger value="rooms" className="gap-2">
                  <Video className="w-4 h-4" />
                  {t('transmission.tabs.rooms')}
                </TabsTrigger>
                <TabsTrigger value="faq" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  {t('transmission.tabs.faq')}
                </TabsTrigger>
              </TabsList>

              {/* Live Tab */}
              <TabsContent value="live" className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <LivePlayer />
                  </div>
                  
                  {/* Upcoming Streams */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{t('transmission.upcomingStreams')}</h3>
                    {upcomingStreams && upcomingStreams.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingStreams.map((stream) => (
                          <Card key={stream.id} className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm leading-tight flex-1">
                                {getTitle(stream.title)}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {formatDate(stream.start_at!)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {getTitle(stream.description)}
                            </p>
                            <Button size="sm" variant="ghost" className="w-full text-xs">
                              {t('transmission.setReminder')}
                            </Button>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-6 text-center text-muted-foreground">
                        <p className="text-sm">{t('transmission.noUpcoming')}</p>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                {/* Day Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((day) => (
                      <Button
                        key={day}
                        variant={selectedDay === day ? 'default' : 'outline'}
                        onClick={() => setSelectedDay(day)}
                      >
                        {t('transmission.day')} {day}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Track Filter */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedTrack === 'all' ? 'default' : 'outline'}
                      onClick={() => setSelectedTrack('all')}
                    >
                      {t('transmission.all')}
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedTrack === 'online' ? 'default' : 'outline'}
                      onClick={() => setSelectedTrack('online')}
                    >
                      {t('transmission.online')}
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedTrack === 'presencial' ? 'default' : 'outline'}
                      onClick={() => setSelectedTrack('presencial')}
                    >
                      {t('transmission.inPerson')}
                    </Button>
                  </div>
                </div>

                {/* Sessions List */}
                {sessionsLoading ? (
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : sessions && sessions.length > 0 ? (
                  <div className="grid gap-4">
                    {sessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">{t('transmission.noSessions')}</p>
                  </Card>
                )}
              </TabsContent>

              {/* Rooms Tab */}
              <TabsContent value="rooms" className="space-y-6">
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <h3>{t('transmission.roomsTitle')}</h3>
                  <p>{t('transmission.roomsDescription')}</p>
                </div>

                {roomsLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : rooms && rooms.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                      <MeetRoomCard key={room.id} room={room} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">{t('transmission.noRooms')}</p>
                  </Card>
                )}
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq">
                <Card className="p-8">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2>{t('transmission.faqTitle')}</h2>
                    
                    <h3>{t('transmission.faq.tech.title')}</h3>
                    <p>{t('transmission.faq.tech.answer')}</p>
                    
                    <h3>{t('transmission.faq.access.title')}</h3>
                    <p>{t('transmission.faq.access.answer')}</p>
                    
                    <h3>{t('transmission.faq.recording.title')}</h3>
                    <p>{t('transmission.faq.recording.answer')}</p>
                    
                    <h3>{t('transmission.faq.support.title')}</h3>
                    <p>{t('transmission.faq.support.answer')}</p>
                  </div>
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

export default Transmissao;
