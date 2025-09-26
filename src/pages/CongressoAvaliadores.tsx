import React from 'react';
import { useCongressoAvaliadores } from '@/hooks/useCongressoAvaliadores';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, ExternalLink, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CongressoAvaliadores = () => {
  const { t } = useTranslation();
  const { data: avaliadores, isLoading } = useCongressoAvaliadores();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Carregando avaliadores...</div>
        </div>
      </div>
    );
  }

  // Agrupar por categoria
  const avaliadoresPorCategoria = avaliadores?.reduce((acc, avaliador) => {
    if (!acc[avaliador.categoria]) {
      acc[avaliador.categoria] = [];
    }
    acc[avaliador.categoria].push(avaliador);
    return acc;
  }, {} as Record<string, typeof avaliadores>) || {};

  const categoriaLabels: Record<string, string> = {
    'coordenador_avaliacao': 'Coordenação de Avaliação',
    'avaliador': 'Avaliadores Principais',
    'revisor_especialista': 'Revisores Especialistas',
    'avaliador_junior': 'Avaliadores Juniores'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Comissão de Avaliação
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
            Conheça os especialistas responsáveis pela avaliação dos trabalhos submetidos ao III CIVENI
          </p>
        </div>
      </div>

      {/* Avaliadores Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-12">
          {Object.entries(avaliadoresPorCategoria).map(([categoria, membros]) => (
            <section key={categoria} className="space-y-8">
              {/* Categoria Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {categoriaLabels[categoria] || categoria}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"></div>
              </div>

              {/* Grid de Membros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {membros?.map((avaliador) => (
                  <Card key={avaliador.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm group">
                    <CardContent className="p-6">
                      {/* Foto e Nome */}
                      <div className="text-center mb-4">
                        <div className="relative mx-auto mb-4">
                          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center ring-4 ring-white shadow-lg group-hover:ring-blue-300 transition-all duration-300">
                            {avaliador.foto_url ? (
                              <img 
                                src={avaliador.foto_url} 
                                alt={avaliador.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-10 h-10 text-blue-400" />
                            )}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                          {avaliador.nome}
                        </h3>
                        
                        {avaliador.cargo_pt && (
                          <p className="text-sm font-medium text-blue-600 mb-2">
                            {avaliador.cargo_pt}
                          </p>
                        )}

                        <p className="text-gray-600 font-medium mb-3">
                          {avaliador.instituicao}
                        </p>

                        {/* Categoria Badge */}
                        <Badge variant="secondary" className="mb-3 bg-blue-100 text-blue-700 border-blue-200">
                          {categoriaLabels[avaliador.categoria] || avaliador.categoria}
                        </Badge>
                      </div>

                      {/* Especialidade */}
                      {avaliador.especialidade && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Área de Especialidade:</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {avaliador.especialidade}
                          </p>
                        </div>
                      )}

                      {/* Contatos */}
                      {(avaliador.email || avaliador.curriculo_url) && (
                        <div className="flex justify-center gap-3 pt-4 border-t border-gray-100">
                          {avaliador.email && (
                            <a 
                              href={`mailto:${avaliador.email}`}
                              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                              title={`Email: ${avaliador.email}`}
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}
                          {avaliador.curriculo_url && (
                            <a 
                              href={avaliador.curriculo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                              title="Ver currículo"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Caso não tenha avaliadores */}
        {(!avaliadores || avaliadores.length === 0) && (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Comissão em Formação
              </h3>
              <p className="text-gray-600">
                A comissão de avaliação está sendo formada. Em breve divulgaremos a lista completa dos avaliadores.
              </p>
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="mt-16 bg-white/70 backdrop-blur-sm rounded-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Sobre o Processo de Avaliação
            </h2>
            <div className="max-w-4xl mx-auto text-gray-600 space-y-4">
              <p>
                A comissão de avaliação do III CIVENI é composta por especialistas renomados de diversas áreas do conhecimento, 
                garantindo uma avaliação criteriosa e multidisciplinar dos trabalhos submetidos.
              </p>
              <p>
                Todos os trabalhos são avaliados de forma duplo-cega (double-blind review), assegurando a imparcialidade 
                e qualidade do processo de seleção.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CongressoAvaliadores;