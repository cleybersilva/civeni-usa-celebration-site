import React, { useState } from 'react';
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
import { useVersionedImage } from '@/hooks/useVersionedImage';

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
  const { versionedUrl, isLoading, error } = useVersionedImage(
    member.foto_url ? resolveAssetUrl(member.foto_url) : ''
  );
  
  // Se não tem foto_url, mostrar placeholder diretamente
  if (!member.foto_url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">
            {member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
      </div>
    );
  }

  // Se está carregando, mostrar skeleton
  if (isLoading) {
    return (
      <div className={`${className} bg-primary/10 animate-pulse`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 bg-primary/20 rounded-full"></div>
        </div>
      </div>
    );
  }

  // Se deu erro ou não conseguiu carregar, mostrar placeholder
  if (error || !versionedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">
            {member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
      </div>
    );
  }

  // Mostrar a imagem carregada
  return (
    <img
      src={versionedUrl}
      alt={member.nome}
      className={className}
      onError={(e) => {
        // Fallback para placeholder se a imagem falhar ao carregar
        console.warn(`Failed to load member photo for ${member.nome}:`, versionedUrl);
        const target = e.currentTarget;
        target.style.display = 'none';
        
        // Criar e inserir o placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'w-full h-full flex items-center justify-center bg-primary/10';
        placeholder.innerHTML = `
          <div class="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
            <span class="text-3xl font-bold text-primary">
              ${member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        `;
        
        target.parentElement?.appendChild(placeholder);
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
      name: 'Coordenação Geral do Evento',
      icon: Crown,
      members: organizadorData || [],
      isLoading: isLoadingOrganizador
    },
    cientifico: {
      name: 'Comitê Científico',
      icon: GraduationCap,
      members: cientificoData || [],
      isLoading: isLoadingCientifico
    },
    apoio_tecnico: {
      name: 'Comitê Operacional',
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
        <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            {/* Breadcrumbs */}
            <nav className="mb-8 text-sm">
              <ol className="flex items-center space-x-2">
                <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
                <li className="text-blue-200">›</li>
                <li><Link to="/congresso/comite" className="hover:text-blue-200 transition-colors">Congresso</Link></li>
                <li className="text-blue-200">›</li>
                <li>Comitê</li>
              </ol>
            </nav>
            
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 font-poppins">
                Comissão Organizadora do Evento
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
                Conheça os profissionais dedicados que tornam o CIVENI uma realidade, trabalhando incansavelmente para oferecer um evento de excelência mundial
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/inscricoes">
                  <button className="bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Fazer Inscrição
                  </button>
                </Link>
                
                <Link to="/palestrantes">
                  <button className="border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Ver Palestrantes
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
        <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Agradecimento Especial
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Nosso sincero agradecimento a todos os membros da comissão organizadora que dedicam seu tempo e expertise para tornar o CIVENI um evento de referência no universo da educação mundial. Seu comprometimento e dedicação são fundamentais para o sucesso do congresso.
            </p>
            
            <div className="flex items-center justify-center">
              <Users className="w-6 h-6 mr-2 text-primary" />
              <p className="text-muted-foreground">
                Para mais informações, entre em contato conosco
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