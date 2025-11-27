import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Play, Calendar, Video, HelpCircle, ExternalLink, Clock, Users, Youtube, MapPin, ChevronRight, Monitor, Mail, User, FileText } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTransmission,
  useTransmissionRooms,
  useUpcomingTransmissions,
  pickLang,
  formatTimezone,
} from '@/hooks/useTransmission';
import { usePublicPresentationRoomsWithAssignments } from '@/hooks/usePresentationRooms';
import TransmissionAgenda from '@/components/transmission/TransmissionAgenda';
import { format } from 'date-fns';
import { ptBR, enUS, es, tr } from 'date-fns/locale';
import { useCMS } from '@/contexts/CMSContext';

// Helper: map i18n language to date-fns locale
const getDateLocale = (lang: string) => {
  switch (lang) {
    case 'en': return enUS;
    case 'es': return es;
    case 'tr': return tr;
    case 'pt':
    default: return ptBR;
  }
};

const TransmissaoAoVivo = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = i18n.language;
  const { content } = useCMS();

  // Parse active tab from hash
  const hash = location.hash.replace('#', '') || 'ao-vivo';
  const [activeTab, setActiveTab] = useState(hash);
  
  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Fetch data
  const { data: transmission, isLoading: txLoading } = useTransmission();
  const { data: rooms = [], isLoading: roomsLoading } = useTransmissionRooms(transmission?.id);
  const { data: upcoming = [], isLoading: upcomingLoading } = useUpcomingTransmissions();
  const { data: presentationRooms = [], isLoading: presentationRoomsLoading } = usePublicPresentationRoomsWithAssignments();

  // Countdown timer
  useEffect(() => {
    const eventDate = content.eventConfig.eventDate;
    if (!eventDate) return;

    const rawTime = content.eventConfig.startTime || '00:00:00';
    const time = /\d{2}:\d{2}:\d{2}/.test(rawTime) ? rawTime : `${rawTime}:00`;
    const targetDate = new Date(`${eventDate}T${time}`).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [content.eventConfig.eventDate, content.eventConfig.startTime]);

  // Sync hash with active tab
  useEffect(() => {
    const hashValue = location.hash.replace('#', '') || 'ao-vivo';
    setActiveTab(hashValue);
  }, [location.hash]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`#${value}`, { replace: true });
  };

  // Extracted localized values
  const title = pickLang(transmission?.title, locale);
  const subtitle = pickLang(transmission?.subtitle, locale);
  const description = pickLang(transmission?.description, locale);
  const badgeLabel = pickLang(transmission?.badge_label, locale);

  // Status badge logic
  const statusBadge = useMemo(() => {
    if (!transmission) return null;
    const now = new Date();
    const startAt = transmission.start_at ? new Date(transmission.start_at) : null;

    if (transmission.status === 'live') {
      return (
        <Badge className="bg-red-600 text-white animate-pulse">
          🔴 {t('transmission.badges.live')}
        </Badge>
      );
    }

    if (transmission.status === 'scheduled' && startAt && startAt > now) {
      const diff = startAt.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return (
        <Badge variant="outline">
          {t('transmission.startsIn', { hours, minutes })}
        </Badge>
      );
    }

    if (transmission.status === 'ended' && badgeLabel) {
      return <Badge variant="secondary">{badgeLabel}</Badge>;
    }

    return null;
  }, [transmission, badgeLabel]);

  // CTA buttons logic
  const primaryCTA = useMemo(() => {
    if (!transmission) return null;

    if (transmission.status === 'live') {
      return {
        label: t('transmission.watchNow'),
        href: '#player',
        icon: <Play className="w-4 h-4" />,
      };
    }

    if (transmission.status === 'scheduled') {
      return {
        label: t('transmission.setReminder'),
        href: `https://www.youtube.com/${transmission.channel_handle}/live`,
        icon: <Calendar className="w-4 h-4" />,
        external: true,
      };
    }

    if (transmission.status === 'ended' && transmission.youtube_video_id) {
      return {
        label: t('transmission.watchReplay'),
        href: '#player',
        icon: <Video className="w-4 h-4" />,
      };
    }

    return null;
  }, [transmission, t]);

  // Timezone text
  const timezoneText = useMemo(() => {
    if (!transmission) return '';
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userLabel = formatTimezone(userTZ);
    const eventLabel = formatTimezone(transmission.timezone);
    return t('transmission.timezoneInfo', { user: userLabel, event: eventLabel });
  }, [transmission, t]);

  if (txLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!transmission) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Transmissão não encontrada</h1>
          <p className="text-muted-foreground mb-8">
            Não há transmissão disponível no momento.
          </p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title} — III CIVENI 2025</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} — III CIVENI 2025`} />
        <meta property="og:description" content={description} />
      </Helmet>

      <Header />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-12 md:py-16 lg:py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-6 md:mb-8 text-xs sm:text-sm">
            <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
              <li>
                <Link to="/" className="hover:text-blue-200 transition-colors">
                  {t('eventsPage.breadcrumbHome', 'Home')}
                </Link>
              </li>
              <li className="text-blue-200">›</li>
              <li>
                <Link to="/programacao-online" className="hover:text-blue-200 transition-colors">
                  {t('schedule.title', 'Programação')}
                </Link>
              </li>
              <li className="text-blue-200">›</li>
              <li className="break-all">{t('transmission.liveTransmission', 'Transmissão ao Vivo')}</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 md:mb-6">
              <Video className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold font-poppins">
                {title || t('transmission.title', 'Transmissão ao vivo')}
              </h1>
              <Video className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 animate-pulse" />
            </div>
            
            {subtitle && (
              <p className="text-sm sm:text-base md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto text-blue-100">
                {subtitle}
              </p>
            )}
            
            {description && (
              <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-6 md:mb-8 max-w-3xl mx-auto text-blue-100">
                {description}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              {primaryCTA && (
                primaryCTA.external ? (
                  <a href={primaryCTA.href} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                      {primaryCTA.icon}
                      {primaryCTA.label}
                    </button>
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      document.querySelector(primaryCTA.href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {primaryCTA.icon}
                    {primaryCTA.label}
                  </button>
                )
              )}
              
              <Link to="/inscricoes" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('transmission.register', 'Fazer Inscrição')}
                </button>
              </Link>
            </div>

            {/* Countdown Timer */}
            <div className="flex flex-col items-center justify-center gap-3 md:gap-4 mt-6 md:mt-8">
              <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl px-4 sm:px-6 md:px-8 py-4 md:py-6 animate-pulse shadow-2xl border border-white/20 w-full max-w-lg">
                <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 font-poppins">
                      {timeLeft.days.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-white/90 font-semibold uppercase tracking-wider">
                      {t('countdown.days')}
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white/60">:</div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 font-poppins">
                      {timeLeft.hours.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-white/90 font-semibold uppercase tracking-wider">
                      {t('countdown.hours')}
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white/60">:</div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 font-poppins">
                      {timeLeft.minutes.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-white/90 font-semibold uppercase tracking-wider">
                      {t('countdown.minutes')}
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white/60">:</div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 font-poppins">
                      {timeLeft.seconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-white/90 font-semibold uppercase tracking-wider">
                      {t('countdown.seconds')}
                    </div>
                  </div>
                </div>
              </div>
              
              {timezoneText && (
                <span className="text-blue-100 text-xs sm:text-sm text-center px-4">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                  {timezoneText}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-2 sm:grid-cols-4 mb-8 md:mb-12 h-auto p-1 gap-1 bg-gradient-to-r from-gray-100 to-gray-50 shadow-lg rounded-xl">
            <TabsTrigger 
              value="ao-vivo" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-red data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base font-semibold">{t('transmission.tabs.live', 'Ao Vivo')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="agenda" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-red data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base font-semibold">{t('transmission.tabs.schedule', 'Agenda')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="salas" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-red data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base font-semibold">{t('transmission.tabs.rooms', 'Salas')}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="faq" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-civeni-blue data-[state=active]:to-civeni-red data-[state=active]:text-white rounded-lg transition-all duration-300 data-[state=active]:shadow-md"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm md:text-base font-semibold">{t('transmission.tabs.faq', 'FAQ')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ao-vivo" className="space-y-10">
            {/* YouTube Player */}
            {transmission.youtube_video_id ? (
              <div id="player" className="space-y-6">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-gray-200 transform transition-all hover:scale-[1.01] duration-300">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${transmission.youtube_video_id}?autoplay=0&rel=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="w-full h-full"
                  />
                </div>
                <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Youtube className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Canal Oficial
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {transmission.channel_handle}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white group" 
                      asChild
                    >
                      <a
                        href={`https://www.youtube.com/${transmission.channel_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir no YouTube
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-16 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <Video className="w-10 h-10 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">{t('transmission.noVideoTitle')}</h3>
                    <p className="text-gray-600 text-base">
                      {t('transmission.noVideoDescription')}
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white transition-all duration-300 group"
                    asChild
                  >
                    <a
                      href="https://www.youtube.com/@veniuniversity"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="w-5 h-5 mr-2" />
                      {t('transmission.visitChannel')}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </Card>
            )}

            {/* Upcoming Transmissions */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {t('transmission.upcomingStreams', 'Próximas Transmissões')}
                </h2>
              </div>
              {upcomingLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : upcoming.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {upcoming.map((tx) => (
                    <Card 
                      key={tx.id} 
                      className="group p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="bg-civeni-blue/10 text-civeni-blue border-civeni-blue/20">
                            {t('transmission.badges.scheduled', 'Agendado')}
                          </Badge>
                          <Calendar className="w-5 h-5 text-civeni-blue" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-civeni-blue transition-colors line-clamp-2">
                          {pickLang(tx.title, locale)}
                        </h3>
                        {tx.start_at && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(tx.start_at).toLocaleString(locale, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                        )}
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white group-hover:shadow-md transition-all" 
                          asChild
                        >
                          <Link to={`/transmissao-ao-vivo/${tx.slug}`}>
                            {t('eventsPage.viewDetails', 'Ver Detalhes')}
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">{t('transmission.noUpcoming', 'Sem próximas transmissões agendadas')}</h3>
                      <p className="text-gray-600">
                        {t('transmission.noStreamDesc', 'Fique atento ao nosso canal no YouTube para futuras transmissões')}
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white transition-all duration-300 group"
                      asChild
                    >
                      <a href="https://www.youtube.com/@veniuniversity" target="_blank" rel="noopener noreferrer">
                        <Youtube className="w-5 h-5 mr-2" />
                        {t('transmission.channel', 'Canal')} YouTube
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="agenda">
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{t('schedule.onlineTitle', 'Agenda Online')}</h2>
                </div>
                <div className="flex gap-3">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white"
                    asChild
                  >
                    <a href="/programacao-online">
                      {t('eventsPage.viewSchedule', 'Ver todas as sessões')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
              
              <TransmissionAgenda />
              
              <Card className="p-8 bg-gradient-to-br from-civeni-blue/5 to-civeni-red/5 border-civeni-blue/20">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <div className="w-16 h-16 bg-civeni-blue/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-civeni-blue" />
                    </div>
                  </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('schedule.title', 'Programação completa disponível')}
                  </h3>
                  <p className="text-gray-600">
                    {t('schedule.description', 'Acesse a programação completa presencial e online com todos os detalhes das atividades')}
                  </p>
                </div>
                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white"
                      asChild
                    >
                      <a href="/programacao-online">
                        <Monitor className="w-5 h-5 mr-2" />
                        {t('transmission.online', 'Online')}
                      </a>
                    </Button>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white"
                      asChild
                    >
                      <a href="/programacao-presencial">
                        <MapPin className="w-5 h-5 mr-2" />
                        {t('transmission.inPerson', 'Presencial')}
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="salas">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t('transmission.roomsTitle', 'Salas de Apresentação de Trabalhos')}</h2>
              </div>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-3xl">
                {t('transmission.roomsDescription', 'Confira a programação das apresentações de trabalhos aprovados. Cada sala possui link para acesso via Google Meet.')}
              </p>
              
              {presentationRoomsLoading ? (
                <div className="grid gap-6">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                  ))}
                </div>
              ) : presentationRooms.length > 0 ? (
                <div className="space-y-4 md:space-y-6">
                  {presentationRooms.map((room) => (
                    <Card 
                      key={room.id} 
                      className="p-4 md:p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-200"
                    >
                      <div className="space-y-4 md:space-y-6">
                        {/* Cabeçalho da sala */}
                        <div className="flex flex-col gap-4 pb-4 border-b border-gray-200">
                          <div className="space-y-2">
                            <h3 className="font-bold text-lg sm:text-xl md:text-2xl text-gray-900 leading-tight">
                              {room.nome_sala}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-civeni-blue" />
                                {format(new Date(room.data_apresentacao), "dd 'de' MMMM 'de' yyyy", { locale: getDateLocale(i18n.language) })}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-civeni-blue" />
                                {room.horario_inicio_sala} - {room.horario_fim_sala}
                              </div>
                              {room.responsavel_sala && (
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-civeni-blue" />
                                  {room.responsavel_sala}
                                </div>
                              )}
                            </div>
                            {room.descricao_sala && (
                              <p className="text-gray-600 text-xs sm:text-sm mt-2">
                                {room.descricao_sala}
                              </p>
                            )}
                          </div>
                          <Button 
                            className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white w-full sm:w-auto text-sm" 
                            size="sm"
                            asChild
                          >
                            <a href={room.meet_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              <span className="truncate">{t('transmission.joinMeet', 'Entrar no Google Meet')}</span>
                            </a>
                          </Button>
                        </div>

                        {/* Lista de trabalhos */}
                        {room.assignments && room.assignments.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-base sm:text-lg text-gray-800">
                              {t('transmission.roomWorks', 'Trabalhos desta sala')} ({room.assignments.length})
                            </h4>
                            <div className="space-y-3">
                              {room.assignments.map((assignment: any, idx: number) => (
                                <div 
                                  key={assignment.id} 
                                  className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-civeni-blue transition-colors"
                                >
                                  <div className="flex items-start gap-2 sm:gap-4">
                                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-civeni-blue/10 text-civeni-blue font-bold shrink-0 text-sm">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1 space-y-2 min-w-0">
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(assignment.inicio_apresentacao), 'HH:mm')} - {format(new Date(assignment.fim_apresentacao), 'HH:mm')}
                                        {assignment.submission?.tipo && (
                                          <Badge variant="outline" className="ml-2">
                                            {assignment.submission.tipo}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-start gap-2">
                                          <User className="w-4 h-4 mt-1 text-civeni-blue shrink-0" />
                                          <span className="font-semibold text-gray-900">
                                            {assignment.submission?.autor_principal || 'N/A'}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <FileText className="w-4 h-4 mt-1 text-civeni-red shrink-0" />
                                          <span className="text-gray-700">
                                            {assignment.submission?.titulo || t('transmission.noWorkTitle', 'Título não disponível')}
                                          </span>
                                        </div>
                                      </div>
                                      {assignment.observacoes && (
                                        <p className="text-sm text-gray-600 italic">
                                          {assignment.observacoes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                ) : (
                <p className="text-gray-500 text-center py-4">
                  {t('transmission.noRooms', 'Nenhum trabalho agendado para esta sala ainda.')}
                </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white shadow-lg border-2 border-dashed border-gray-300 rounded-2xl">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Video className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">{t('transmission.noRoomsAvailable')}</h3>
                      <p className="text-gray-600">
                        {t('transmission.noRoomsDescription')}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-1 w-8 md:w-12 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full"></div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{t('transmission.faqTitle', 'Perguntas Frequentes')}</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                {/* FAQ Items */}
                <Card className="p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-civeni-blue" />
                      </div>
                    <div className="space-y-2 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-gray-900">{t('transmission.faq.tech.title')}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {t('transmission.faq.tech.answer')}
                      </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-civeni-blue" />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-gray-900">{t('transmission.faq.access.title')}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {t('transmission.faq.access.answer')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-civeni-blue" />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-gray-900">{t('transmission.faq.recording.title')}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {t('transmission.faq.recording.answer')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="p-2 bg-civeni-blue/10 rounded-lg shrink-0">
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-civeni-blue" />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-gray-900">{t('transmission.faq.support.title')}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {t('transmission.faq.support.answer')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Additional help CTA */}
              <Card className="p-10 text-center bg-gradient-to-br from-civeni-blue/5 to-civeni-red/5 border-civeni-blue/20 shadow-md">
                <div className="max-w-2xl mx-auto space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">{t('transmission.faq.ctaTitle', 'Ainda tem dúvidas?')}</h3>
                  <p className="text-gray-600">
                    {t('transmission.noStreamDesc', 'Nossa equipe está pronta para ajudar. Entre em contato conosco para mais informações.')}
                  </p>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-civeni-blue to-civeni-red hover:opacity-90 text-white group shadow-lg"
                    asChild
                  >
                    <Link to="/contato">
                      {t('contact.title', 'Entre em Contato')}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

export default TransmissaoAoVivo;
