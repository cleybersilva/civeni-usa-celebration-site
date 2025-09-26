import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, GraduationCap, Settings, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import cleyberPhoto from '@/assets/cleyber-gomes.jpg';

interface CommitteeMember {
  id: string;
  name: string;
  role?: string;
  affiliation: string;
  photo_url?: string;
}

const CongressoComite = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('coordenacao');

  // Committee data organized by type
  const committeesData = {
    coordenacao: {
      name: 'Coordenação Geral do Evento',
      icon: Crown,
      members: [
        {
          id: '1',
          name: 'Profa. Dra. Marcela Tarciana Martins',
          role: 'Reitora de Relações Acadêmicas',
          affiliation: 'VCCU'
        },
        {
          id: '2', 
          name: 'Profa. Dra. Maria Emilia Camargo',
          role: 'Reitora de Relações Internacionais',
          affiliation: 'VCCU'
        }
      ]
    },
    cientifico: {
      name: 'Comitê Científico',
      icon: GraduationCap,
      members: [
        {
          id: '3',
          name: 'Profa. Dra. Ana Célia Querino',
          affiliation: 'VCCU'
        },
        {
          id: '4',
          name: 'Prof. Dr. Eloy Lemos Júnior',
          affiliation: 'VCCU'
        },
        {
          id: '5',
          name: 'Profa. Dra. Esra Sipahi Döngül',
          affiliation: 'Akasaray University, Faculty of Health Sciences'
        },
        {
          id: '6',
          name: 'Prof. Dr. Aprigio Telles Mascarenhas Neto',
          affiliation: 'Faculdade de Direito 8 de Julho'
        },
        {
          id: '7',
          name: 'Profa. Dra. Marta Elisete Ventura da Motta',
          affiliation: 'FASOL'
        },
        {
          id: '8',
          name: 'Prof. Dr. Henrique Rodrigues Lelis',
          affiliation: 'VCCU'
        },
        {
          id: '9',
          name: 'Prof. Dr. Mhardoquel Geraldo Lima França',
          affiliation: 'VCCU'
        },
        {
          id: '10',
          name: 'Profa. Dra. Mariane Camargo Priesnitz',
          affiliation: 'VCCU'
        },
        {
          id: '11',
          name: 'Profa. Dra. Margarete Luiza Alburgeri',
          affiliation: 'UAL - Portugal'
        },
        {
          id: '12',
          name: 'Prof. Dr. Walter Priesnitz Filho',
          affiliation: 'CTISM – UFSM, Brasil'
        },
        {
          id: '13',
          name: 'Prof. Dr. Ricardo Oliveira',
          affiliation: 'UFS, Brasil'
        },
        {
          id: '14',
          name: 'Prof. Dr. Ramon Olímpio de Oliveira',
          affiliation: 'VCCU'
        },
        {
          id: '15',
          name: 'Profa. Dra. Vivianne de Sousa',
          affiliation: 'VCCU'
        },
        {
          id: '16',
          name: 'Profa. Dra. Gabriela Marcolino',
          affiliation: 'VCCU'
        }
      ]
    },
    operacional: {
      name: 'Comitê Operacional',
      icon: Settings,
      members: [
        {
          id: '17',
          name: 'Profa. Eliete Francisca da Silva Farias',
          affiliation: 'VCCU'
        },
        {
          id: '18',
          name: 'Gabriely Cristina Queiroga Diniz',
          affiliation: 'VCCU'
        },
        {
          id: '19',
          name: 'Cleyber Gomes da Silva',
          affiliation: 'VCCU',
          photo_url: cleyberPhoto
        }
      ]
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
                  
                  <div className={`grid gap-8 place-items-center ${key === 'coordenacao' ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' : key === 'cientifico' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5 max-w-6xl mx-auto' : 'grid-cols-1 md:grid-cols-3 max-w-3xl mx-auto'}`}>
                    {committee.members.map((member) => (
                      <Card key={member.id} className="group hover:shadow-xl transition-all duration-300 hover-scale overflow-hidden">
                        <CardContent className="p-0">
                          {/* Photo Section */}
                          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                            {member.photo_url ? (
                              <img
                                src={member.photo_url}
                                alt={member.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                                  <span className="text-3xl font-bold text-primary">
                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Info Section */}
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                              {member.name}
                            </h3>
                            
                            {member.role && (
                              <p className="text-sm font-medium text-primary mb-3 line-clamp-2">
                                {member.role}
                              </p>
                            )}
                            
                            <div className={`flex items-center text-sm text-muted-foreground mb-4 ${member.affiliation === 'VCCU' || member.affiliation === 'FASOL' || member.affiliation === 'UAL - Portugal' || member.affiliation === 'UFS, Brasil' ? 'justify-center' : ''}`}>
                              <GraduationCap className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="line-clamp-2">{member.affiliation}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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