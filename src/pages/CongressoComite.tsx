import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Building } from 'lucide-react';

interface ComiteMember {
  id: string;
  nome: string;
  cargo_pt: string;
  cargo_en: string;
  cargo_es: string;
  instituicao: string;
  foto_url?: string;
  categoria: 'organizador' | 'cientifico' | 'avaliacao' | 'apoio_tecnico';
  ordem: number;
}

const CongressoComite = () => {
  const { t, i18n } = useTranslation();
  const [comiteMembers, setComiteMembers] = useState<ComiteMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComiteMembers();
  }, []);

  const fetchComiteMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('congresso_comite')
        .select('*')
        .eq('is_active', true)
        .order('categoria')
        .order('ordem');

      if (error) {
        console.error('Error fetching comite members:', error);
        return;
      }

      setComiteMembers((data || []) as ComiteMember[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLanguageCargo = (member: ComiteMember) => {
    const lang = i18n.language;
    switch (lang) {
      case 'en':
        return member.cargo_en || member.cargo_pt;
      case 'es':
        return member.cargo_es || member.cargo_pt;
      default:
        return member.cargo_pt;
    }
  };

  const getCategoryTitle = (categoria: string) => {
    const titles = {
      organizador: {
        pt: 'Comitê Organizador',
        en: 'Organizing Committee',
        es: 'Comité Organizador'
      },
      cientifico: {
        pt: 'Comitê Científico',
        en: 'Scientific Committee',
        es: 'Comité Científico'
      },
      avaliacao: {
        pt: 'Comissão de Avaliação',
        en: 'Evaluation Committee',
        es: 'Comisión de Evaluación'
      },
      apoio_tecnico: {
        pt: 'Comissão de Apoio Técnico',
        en: 'Technical Support Committee',
        es: 'Comisión de Apoyo Técnico'
      }
    };

    const lang = i18n.language as 'pt' | 'en' | 'es';
    return titles[categoria as keyof typeof titles]?.[lang] || titles[categoria as keyof typeof titles]?.pt;
  };

  const getCategoryBadgeColor = (categoria: string) => {
    const colors = {
      organizador: 'bg-primary text-primary-foreground',
      cientifico: 'bg-secondary text-secondary-foreground',
      avaliacao: 'bg-accent text-accent-foreground',
      apoio_tecnico: 'bg-muted text-muted-foreground'
    };
    return colors[categoria as keyof typeof colors] || colors.organizador;
  };

  const groupedMembers = comiteMembers.reduce((acc, member) => {
    if (!acc[member.categoria]) {
      acc[member.categoria] = [];
    }
    acc[member.categoria].push(member);
    return acc;
  }, {} as Record<string, ComiteMember[]>);

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              {t('congress.committee.title', 'Comitê do Congresso')}
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-4xl mx-auto">
              {t('congress.committee.description', 'Conheça os profissionais dedicados que tornam o CIVENI uma realidade, trabalhando incansavelmente para oferecer um evento de excelência.')}
            </p>
          </div>
        </div>
      </section>

      {/* Committee Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {Object.entries(groupedMembers).map(([categoria, members]) => (
            <div key={categoria} className="mb-16">
              <div className="text-center mb-12">
                <Badge className={`${getCategoryBadgeColor(categoria)} text-lg px-6 py-2 mb-4`}>
                  {getCategoryTitle(categoria)}
                </Badge>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  {getCategoryTitle(categoria)}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {members.map((member) => (
                  <Card key={member.id} className="group hover:shadow-xl transition-all duration-300 hover-scale overflow-hidden">
                    <CardContent className="p-0">
                      {/* Photo Section */}
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                        {member.foto_url ? (
                          <img
                            src={member.foto_url}
                            alt={member.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-3xl font-bold text-primary">
                                {member.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Overlay with category badge */}
                        <div className="absolute top-4 right-4">
                          <Badge className={`${getCategoryBadgeColor(categoria)} text-xs`}>
                            {categoria.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Info Section */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                          {member.nome}
                        </h3>
                        
                        <p className="text-sm font-medium text-primary mb-3 line-clamp-2">
                          {getCurrentLanguageCargo(member)}
                        </p>
                        
                        <div className="flex items-center text-sm text-muted-foreground mb-4">
                          <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="line-clamp-2">{member.instituicao}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

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
  );
};

export default CongressoComite;