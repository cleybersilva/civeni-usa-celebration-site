import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, GraduationCap, Settings, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCongressoComiteByCategory } from '@/hooks/useCongressoComite';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { loadOptimizedImage, createInitials } from '@/utils/imageOptimization';

interface CommitteeMember {
  id: string;
  nome: string;
  cargo_pt?: string;
  instituicao: string;
  foto_url?: string;
  categoria: 'organizador' | 'cientifico' | 'avaliacao' | 'apoio_tecnico';
  ordem: number;
  is_active: boolean;
}

const MemberPhoto: React.FC<{ member: CommitteeMember; className?: string }> = ({ member, className }) => {
  const [imageState, setImageState] = useState<'loading' | 'success' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loadProgress, setLoadProgress] = useState(0);
  
  useEffect(() => {
    if (!member.foto_url) {
      setImageState('error');
      return;
    }

    const loadImage = async () => {
      setImageState('loading');
      setImageSrc('');
      setLoadProgress(0);
      
      try {
        let finalUrl = member.foto_url;
        
        // If not base64, resolve the URL with cache busting
        if (!finalUrl.startsWith('data:image/')) {
          finalUrl = `${resolveAssetUrl(finalUrl)}?cb=${Date.now()}&r=${Math.random()}`;
          console.log(`🔄 Loading committee image for ${member.nome}:`, finalUrl);
        }
        
        const result = await loadOptimizedImage(finalUrl, {
          timeout: 15000, // 15 second timeout
          onProgress: setLoadProgress
        });
        
        if (result.success) {
          console.log(`✅ Successfully loaded image for ${member.nome}${result.size ? ` (${result.size}KB)` : ''}`);
          setImageSrc(result.src);
          setImageState('success');
        } else {
          console.error(`❌ Failed to load image for ${member.nome}:`, result.error);
          setImageState('error');
        }
      } catch (error) {
        console.error(`❌ Unexpected error loading image for ${member.nome}:`, error);
        setImageState('error');
      }
    };

    loadImage();
  }, [member.foto_url, member.nome]);
  
  // Loading state with progress
  if (imageState === 'loading') {
    return (
      <div className={`${className} bg-primary/10 flex items-center justify-center relative overflow-hidden`}>
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center relative">
          {/* Progress ring */}
          <svg className="w-20 h-20 absolute" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary/30"
            />
            <circle
              cx="21"
              cy="21"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="113"
              strokeDashoffset={113 - (loadProgress / 100) * 113}
              className="text-primary transition-all duration-300"
              transform="rotate(-90 21 21)"
            />
          </svg>
          <span className="text-sm font-bold text-primary z-10">
            {Math.round(loadProgress)}%
          </span>
        </div>
        <div className="absolute bottom-1 left-1 right-1 text-center">
          <div className="text-xs text-primary/70 font-medium">Carregando...</div>
        </div>
      </div>
    );
  }

  // Error state or no image - show placeholder
  if (imageState === 'error' || !imageSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">
            {createInitials(member.nome)}
          </span>
        </div>
      </div>
    );
  }

  // Success state - show the image
  return (
    <img
      src={imageSrc}
      alt={member.nome}
      className={className}
      loading="lazy"
      onLoad={() => {
        console.log(`🖼️ Image rendered successfully for ${member.nome}`);
      }}
      onError={(e) => {
        console.error(`❌ Image render failed for ${member.nome}`);
        setImageState('error');
      }}
    />
  );
};

const CongressoComite = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('organizador');
  const queryClient = useQueryClient();

  // Fetch data from database with automatic refresh
  const { data: organizadorData, isLoading: isLoadingOrganizador, refetch: refetchOrganizador } = useCongressoComiteByCategory('organizador');
  const { data: cientificoData, isLoading: isLoadingCientifico, refetch: refetchCientifico } = useCongressoComiteByCategory('cientifico');
  const { data: apoioTecnicoData, isLoading: isLoadingApoioTecnico, refetch: refetchApoioTecnico } = useCongressoComiteByCategory('apoio_tecnico');

  // Refresh data periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['congresso-comite'] });
      refetchOrganizador();
      refetchCientifico();
      refetchApoioTecnico();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [queryClient, refetchOrganizador, refetchCientifico, refetchApoioTecnico]);

  // Committee data organized by type
  const committeesData = {
    organizador: {
      name: t('congressCommittee.organizingTitle'),
      icon: Crown,
      members: organizadorData || [],
      isLoading: isLoadingOrganizador
    },
    cientifico: {
      name: t('congressCommittee.scientificTitle'),
      icon: GraduationCap,
      members: cientificoData || [],
      isLoading: isLoadingCientifico
    },
    apoio_tecnico: {
      name: t('congressCommittee.operationalTitle'),
      icon: Settings,
      members: apoioTecnicoData || [],
      isLoading: isLoadingApoioTecnico
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-12 md:py-16 lg:py-20">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            {/* Breadcrumbs */}
            <nav className="mb-6 md:mb-8 text-xs md:text-sm">
              <ol className="flex items-center space-x-2">
                <li><Link to="/" className="hover:text-blue-200 transition-colors">{t('congressCommittee.breadcrumbHome')}</Link></li>
                <li className="text-blue-200">›</li>
                <li><Link to="/congresso/comite" className="hover:text-blue-200 transition-colors">{t('congressCommittee.breadcrumbCongress')}</Link></li>
                <li className="text-blue-200">›</li>
                <li>{t('congressCommittee.breadcrumbCommittee')}</li>
              </ol>
            </nav>
            
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 font-poppins">
                {t('congressCommittee.pageTitle')}
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto text-blue-100 px-2">
                {t('congressCommittee.heroSubtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
                <Link to="/inscricoes" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                    {t('congressCommittee.registerButton')}
                  </button>
                </Link>
                
                <Link to="/palestrantes" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-sm md:text-base font-semibold transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                    {t('congressCommittee.viewSpeakersButton')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Committee Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-12">
                {Object.entries(committeesData).map(([key, committee]) => (
                  <TabsTrigger key={key} value={key} className="text-sm flex items-center gap-2">
                    <committee.icon className="w-4 h-4" />
                    {committee.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Object.entries(committeesData).map(([key, committee]) => (
                <TabsContent key={key} value={key}>
                  <div className="text-center mb-12">
                    <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 mb-4 flex items-center gap-2 justify-center w-fit mx-auto">
                      <committee.icon className="w-5 h-5" />
                      {committee.name}
                    </Badge>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                      {committee.name}
                    </h2>
                  </div>
                  
                  {committee.isLoading ? (
                    <div className={`grid gap-8 place-items-center ${key === 'organizador' ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' : key === 'cientifico' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5 max-w-6xl mx-auto' : 'grid-cols-1 md:grid-cols-3 max-w-3xl mx-auto'}`}>
                      {[...Array(key === 'cientifico' ? 8 : 3)].map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                          <CardContent className="p-0">
                            <Skeleton className="aspect-square w-full" />
                            <div className="p-6">
                              <Skeleton className="h-6 mb-2" />
                              <Skeleton className="h-4 mb-3" />
                              <Skeleton className="h-4" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className={`grid gap-8 place-items-center ${key === 'organizador' ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' : key === 'cientifico' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5 max-w-6xl mx-auto' : 'grid-cols-1 md:grid-cols-3 max-w-3xl mx-auto'}`}>
                      {committee.members.map((member) => (
                        <Card key={member.id} className="group hover:shadow-xl transition-all duration-300 hover-scale overflow-hidden">
                          <CardContent className="p-0">
                            {/* Photo Section */}
                            <div className="relative aspect-square overflow-hidden bg-primary">
                              <MemberPhoto 
                                member={member} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            
                            {/* Info Section */}
                            <div className="p-6">
                              <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                                {member.nome}
                              </h3>
                              
                              {member.cargo_pt && (
                                <p className="text-sm font-medium text-primary mb-3 line-clamp-2">
                                  {member.cargo_pt}
                                </p>
                              )}
                              
                              <div className={`flex items-center text-sm text-muted-foreground mb-4 ${member.instituicao === 'VCCU' || member.instituicao === 'FASOL' || member.instituicao === 'UAL - Portugal' || member.instituicao === 'UFS, Brasil' ? 'justify-center' : ''}`}>
                                <GraduationCap className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="line-clamp-2">{member.instituicao}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </section>

        {/* Acknowledgment Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
              {t('congressCommittee.acknowledgmentTitle')}
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
              {t('congressCommittee.acknowledgmentDescription')}
            </p>
            
            <div className="flex items-center justify-center">
              <Users className="w-5 h-5 md:w-6 md:h-6 mr-2 text-primary" />
              <p className="text-sm md:text-base text-muted-foreground">
                {t('congressCommittee.contactInfo')}
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default CongressoComite;