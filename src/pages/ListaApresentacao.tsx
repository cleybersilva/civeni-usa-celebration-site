import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Download } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ApprovedWork {
  id: string;
  area: string;
  numero: number;
  titulo: string;
  autor_responsavel: string;
  observacoes?: string;
}

const AREAS = [
  'EDUCAÇÃO',
  'CIÊNCIAS JURÍDICAS',
  'ADMINISTRAÇÃO, SUSTENTABILIDADE E TECNOLOGIA',
];

const ListaApresentacao = () => {
  const { t } = useTranslation();
  const [works, setWorks] = useState<ApprovedWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorks();
  }, []);

  const fetchWorks = async () => {
    try {
      const { data, error } = await supabase
        .from('approved_works')
        .select('*')
        .order('area')
        .order('numero');

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedWorks = AREAS.reduce((acc, area) => {
    acc[area] = works.filter(w => w.area === area);
    return acc;
  }, {} as Record<string, ApprovedWork[]>);

  const getAreaGradient = (area: string) => {
    switch (area) {
      case 'EDUCAÇÃO':
        return 'from-blue-600 to-blue-800';
      case 'CIÊNCIAS JURÍDICAS':
        return 'from-purple-600 to-purple-800';
      case 'ADMINISTRAÇÃO, SUSTENTABILIDADE E TECNOLOGIA':
        return 'from-green-600 to-green-800';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  const totalWorks = works.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-poppins">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-civeni-blue to-civeni-red text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <nav className="mb-8 text-sm">
            <ol className="flex items-center space-x-2 flex-wrap">
              <li><Link to="/" className="hover:text-blue-200 transition-colors">Home</Link></li>
              <li className="text-blue-200">›</li>
              <li><Link to="/submissao-trabalhos" className="hover:text-blue-200 transition-colors">{t('works.breadcrumb', 'Trabalhos')}</Link></li>
              <li className="text-blue-200">›</li>
              <li>{t('works.approvedList.title', 'Lista de Apresentação')}</li>
            </ol>
          </nav>
          
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-6 font-poppins">
              {t('works.approvedList.heroTitle', 'Artigos e Projetos Aprovados')}
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-blue-100">
              {t('works.approvedList.heroSubtitle', 'Confira a lista completa dos trabalhos aprovados para apresentação no III CIVENI 2025')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/submissao-trabalhos" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-white text-civeni-blue hover:bg-white/90 px-8 py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('works.submitWork', 'Submeter Trabalho')}
                </button>
              </Link>
              
              <Link to="/inscricoes" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto border-white text-white hover:bg-white/20 border-2 px-8 py-3 rounded-full font-semibold transition-colors flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  {t('works.makeRegistration', 'Fazer Inscrição')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-gradient-to-r from-civeni-blue to-civeni-red text-white">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold">{totalWorks}</p>
                  <p className="text-sm opacity-90">{t('works.approvedList.totalWorks', 'Total de Artigos')}</p>
                </CardContent>
              </Card>
              {AREAS.map((area) => {
                const count = groupedWorks[area]?.length || 0;
                return (
                  <Card key={area} className={`bg-gradient-to-r ${getAreaGradient(area)} text-white`}>
                    <CardContent className="p-6 text-center">
                      <p className="text-4xl font-bold">{count}</p>
                      <p className="text-xs opacity-90 line-clamp-1">{area}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Section Title */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-poppins">
                {t('works.approvedList.sectionTitle', 'Listagem por Área Temática')}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t('works.approvedList.sectionDescription', 'Os trabalhos estão organizados por área temática. Clique em cada área para expandir a lista.')}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{t('common.loading', 'Carregando...')}</p>
              </div>
            ) : works.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-civeni-blue to-civeni-red rounded-full flex items-center justify-center">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t('works.approvedList.noWorks', 'Lista em Breve')}
                  </h3>
                  <p className="text-muted-foreground">
                    {t('works.approvedList.noWorksDescription', 'A lista de artigos aprovados será publicada em breve.')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" defaultValue={AREAS} className="space-y-4">
                {AREAS.map((area) => {
                  const areaWorks = groupedWorks[area] || [];
                  
                  return (
                    <AccordionItem key={area} value={area} className="border-0 rounded-xl overflow-hidden shadow-lg">
                      <AccordionTrigger className={`px-6 py-4 bg-gradient-to-r ${getAreaGradient(area)} text-white hover:no-underline hover:opacity-95 transition-opacity`}>
                        <div className="flex items-center gap-3 text-left">
                          <FileText className="w-6 h-6 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-lg block">ÁREA: {area}</span>
                            <span className="text-sm opacity-90">{areaWorks.length} {t('works.approvedList.articles', 'artigos aprovados')}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0 bg-white">
                        {areaWorks.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            {t('works.approvedList.noWorksInArea', 'Nenhum artigo nesta área')}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-50">
                                  <TableHead className="w-20 text-center font-bold">Nº</TableHead>
                                  <TableHead className="font-bold">{t('works.approvedList.tableTitle', 'Título')}</TableHead>
                                  <TableHead className="w-64 font-bold">{t('works.approvedList.tableAuthor', 'Autor Responsável')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {areaWorks.map((work, index) => (
                                  <TableRow 
                                    key={work.id} 
                                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                                  >
                                    <TableCell className="text-center font-semibold text-civeni-blue">
                                      {work.numero}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {work.titulo}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                      {work.autor_responsavel}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}

            {/* Footer Note */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {t('works.approvedList.footerNote', 'A lista está sujeita a alterações. Última atualização em Dezembro de 2025.')}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListaApresentacao;
