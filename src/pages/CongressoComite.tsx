import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Building, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Committee {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

interface CMSPageData {
  id: string;
  title: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  content_md: string;
  status: string;
}

interface CommitteeMember {
  id: string;
  committee_id: string;
  name: string;
  role: string;
  affiliation: string;
  photo_url?: string;
  email?: string;
  lattes_url?: string;
  linkedin_url?: string;
  sort_order: number;
  visible: boolean;
}

const CongressoComite = () => {
  const { t, i18n } = useTranslation();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [activeCommittee, setActiveCommittee] = useState<string>('');
  const [pageData, setPageData] = useState<CMSPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [i18n.language]);

  const fetchData = async () => {
    try {
      const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language;
      
      // Fetch page data
      const { data: pageDataResponse, error: pageError } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', 'congresso/comite')
        .eq('locale', locale)
        .eq('status', 'published')
        .single();

      if (pageDataResponse) {
        setPageData(pageDataResponse);
      } else if (locale !== 'pt-BR') {
        // Fallback to Portuguese
        const { data: fallbackData } = await supabase
          .from('cms_pages')
          .select('*')
          .eq('slug', 'congresso/comite')
          .eq('locale', 'pt-BR')
          .eq('status', 'published')
          .single();
        
        if (fallbackData) {
          setPageData(fallbackData);
        }
      }
      
      // Fetch committees
      const { data: committeesData, error: committeesError } = await supabase
        .from('cms_committees')
        .select('*')
        .eq('locale', locale)
        .order('sort_order');

      if (committeesError) {
        console.error('Error fetching committees:', committeesError);
        return;
      }

      setCommittees(committeesData || []);
      
      // Set active committee to first one
      if (committeesData && committeesData.length > 0) {
        const firstCommittee = committeesData[0].id;
        setActiveCommittee(firstCommittee);
        
        // Fetch members for the first committee
        await fetchCommitteeMembers(firstCommittee, locale);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommitteeMembers = async (committeeId: string, locale: string = 'pt-BR') => {
    try {
      const { data, error } = await supabase
        .from('cms_committee_members')
        .select('*')
        .eq('committee_id', committeeId)
        .eq('locale', locale)
        .eq('visible', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching committee members:', error);
        return;
      }

      setCommitteeMembers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCommitteeChange = async (committeeId: string) => {
    setActiveCommittee(committeeId);
    const locale = i18n.language === 'pt' ? 'pt-BR' : i18n.language;
    await fetchCommitteeMembers(committeeId, locale);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-8">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              {pageData?.hero_title || t('congress.committee.title', 'Comitê do Congresso')}
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-4xl mx-auto">
              {pageData?.hero_subtitle || t('congress.committee.description', 'Conheça os profissionais dedicados que tornam o CIVENI uma realidade, trabalhando incansavelmente para oferecer um evento de excelência.')}
            </p>
          </div>
        </div>
      </section>

      {/* Committee Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {committees.length > 0 && (
            <Tabs value={activeCommittee} onValueChange={handleCommitteeChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-12">
                {committees.map((committee) => (
                  <TabsTrigger key={committee.id} value={committee.id} className="text-sm">
                    {committee.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {committees.map((committee) => (
                <TabsContent key={committee.id} value={committee.id}>
                  <div className="text-center mb-12">
                    <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 mb-4">
                      {committee.name}
                    </Badge>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                      {committee.name}
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {committeeMembers.map((member) => (
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
                            
                            <div className="flex items-center text-sm text-muted-foreground mb-4">
                              <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="line-clamp-2">{member.affiliation}</span>
                            </div>
                            
                            {/* Links */}
                            {(member.lattes_url || member.linkedin_url || member.email) && (
                              <div className="flex flex-wrap gap-2">
                                {member.lattes_url && (
                                  <a
                                    href={member.lattes_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Lattes
                                  </a>
                                )}
                                {member.linkedin_url && (
                                  <a
                                    href={member.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs bg-accent text-accent-foreground px-2 py-1 rounded hover:bg-accent/80 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    LinkedIn
                                  </a>
                                )}
                                {member.email && (
                                  <a
                                    href={`mailto:${member.email}`}
                                    className="inline-flex items-center text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-muted/80 transition-colors"
                                  >
                                    <Mail className="w-3 h-3 mr-1" />
                                    Email
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {committeeMembers.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        {t('congress.committee.no_members', 'Nenhum membro encontrado para este comitê.')}
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </section>

      {/* Content Section */}
      {pageData?.content_md && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <article className="prose prose-lg prose-slate max-w-none dark:prose-invert">
                <ReactMarkdown>{pageData.content_md}</ReactMarkdown>
              </article>
            </div>
          </div>
        </section>
      )}

      {/* Acknowledgment Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            {t('congress.committee.acknowledgment.title', 'Agradecimento Especial')}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('congress.committee.acknowledgment.description', 'Nosso sincero agradecimento a todos os membros do comitê que dedicam seu tempo e expertise para tornar o CIVENI um evento de referência no ensino de engenharia. Seu comprometimento e dedicação são fundamentais para o sucesso do congresso.')}
          </p>
          
          <div className="flex items-center justify-center">
            <Mail className="w-6 h-6 mr-2 text-primary" />
            <p className="text-muted-foreground">
              {t('congress.committee.contact', 'Para mais informações, entre em contato conosco')}
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