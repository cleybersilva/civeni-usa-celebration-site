import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Calendar, Video, HelpCircle, ExternalLink, Clock, Users } from 'lucide-react';
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

const TransmissaoAoVivo = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = i18n.language;

  // Parse active tab from hash
  const hash = location.hash.replace('#', '') || 'ao-vivo';
  const [activeTab, setActiveTab] = useState(hash);

  // Fetch data
  const { data: transmission, isLoading: txLoading } = useTransmission();
  const { data: rooms = [], isLoading: roomsLoading } = useTransmissionRooms(transmission?.id);
  const { data: upcoming = [], isLoading: upcomingLoading } = useUpcomingTransmissions();

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
      return <Badge className="bg-red-600 text-white animate-pulse">🔴 AO VIVO</Badge>;
    }

    if (transmission.status === 'scheduled' && startAt && startAt > now) {
      const diff = startAt.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return <Badge variant="outline">Começa em {hours}h {minutes}min</Badge>;
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
        label: 'Assistir agora',
        href: '#player',
        icon: <Play className="w-4 h-4" />,
      };
    }

    if (transmission.status === 'scheduled') {
      return {
        label: 'Definir lembrete',
        href: `https://www.youtube.com/${transmission.channel_handle}/live`,
        icon: <Calendar className="w-4 h-4" />,
        external: true,
      };
    }

    if (transmission.status === 'ended' && transmission.youtube_video_id) {
      return {
        label: 'Assistir replay',
        href: '#player',
        icon: <Video className="w-4 h-4" />,
      };
    }

    return null;
  }, [transmission]);

  // Timezone text
  const timezoneText = useMemo(() => {
    if (!transmission) return '';
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const userLabel = formatTimezone(userTZ);
    const eventLabel = formatTimezone(transmission.timezone);
    return `Horários em ${userLabel} • Local: ${eventLabel}`;
  }, [transmission]);

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

      {/* Hero Banner with Gradient */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2">
              <li><a href="/" className="hover:text-blue-200 transition-colors">Home</a></li>
              <li className="text-blue-200">›</li>
              <li><a href="/programacao-online" className="hover:text-blue-200 transition-colors">Programação</a></li>
              <li className="text-blue-200">›</li>
              <li>Transmissão ao Vivo</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
              {title}
            </h1>
            {description && (
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
                {description}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              {primaryCTA && (
                primaryCTA.external ? (
                  <a href={primaryCTA.href} target="_blank" rel="noopener noreferrer">
                    <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                      {primaryCTA.icon}
                      {primaryCTA.label}
                    </button>
                  </a>
                ) : (
                  <button 
                    onClick={() => {
                      document.querySelector(primaryCTA.href)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
                  >
                    {primaryCTA.icon}
                    {primaryCTA.label}
                  </button>
                )
              )}
              <a href="/inscricoes">
                <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Fazer Inscrição
                </button>
              </a>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center">
              {statusBadge}
              {timezoneText && (
                <div className="flex items-center gap-2 text-sm opacity-80">
                  <Clock className="w-4 h-4" />
                  <span>{timezoneText}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="ao-vivo" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Ao vivo
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="salas" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Salas
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ao-vivo" className="space-y-8">
            {/* YouTube Player */}
            {transmission.youtube_video_id ? (
              <div id="player" className="space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
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
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Canal: {transmission.channel_handle}
                  </p>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`https://www.youtube.com/${transmission.channel_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir no YouTube
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Nenhum vídeo disponível</h3>
                <p className="text-muted-foreground mb-4">
                  A transmissão ainda não começou ou não há replay disponível.
                </p>
                {transmission.channel_handle && (
                  <Button variant="outline" asChild>
                    <a
                      href={`https://www.youtube.com/${transmission.channel_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visite o canal
                    </a>
                  </Button>
                )}
              </Card>
            )}

            {/* Upcoming Transmissions */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Próximas transmissões</h2>
              {upcomingLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : upcoming.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map((tx) => (
                    <Card key={tx.id} className="p-4">
                      <h3 className="font-semibold mb-2">{pickLang(tx.title, locale)}</h3>
                      {tx.start_at && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {new Date(tx.start_at).toLocaleString(locale, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      )}
                      <Button size="sm" variant="outline" className="w-full">
                        Detalhes
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Sem próximas transmissões agendadas
                  </p>
                  <Button variant="outline" asChild>
                    <a href={`https://www.youtube.com/${transmission.channel_handle}`} target="_blank" rel="noopener noreferrer">
                      Veja o canal no YouTube
                    </a>
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="agenda">
            <Card className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Programação completa</h3>
              <p className="text-muted-foreground mb-6">
                Veja a agenda completa do evento na programação online.
              </p>
              <Button asChild>
                <a href={transmission.schedule_url || '/programacao-online'}>
                  Ver programação
                </a>
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="salas">
            {roomsLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <Card key={room.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg">
                        {pickLang(room.name, locale)}
                      </h3>
                      {room.is_live && (
                        <Badge className="bg-red-600 text-white">Ao vivo</Badge>
                      )}
                    </div>
                    <Button className="w-full" asChild>
                      <a href={room.meet_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Entrar na sala
                      </a>
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma sala disponível no momento</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="faq">
            <Card className="p-8 text-center">
              <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Perguntas frequentes</h3>
              <p className="text-muted-foreground mb-6">
                Veja as perguntas mais comuns sobre a transmissão.
              </p>
              <Button variant="outline" asChild>
                <a href={transmission.faq_url || '#faq'}>Ver FAQ</a>
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

export default TransmissaoAoVivo;
