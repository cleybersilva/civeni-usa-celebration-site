import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useCongressoComite = () => {
  return useQuery({
    queryKey: ['congresso-comite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('congresso_comite')
        .select('*')
        .eq('is_active', true)
        .order('ordem');

      if (error) {
        throw error;
      }

      return data as CommitteeMember[];
    },
  });
};

export const useCongressoComiteByCategory = (categoria: string) => {
  return useQuery({
    queryKey: ['congresso-comite', categoria],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('congresso_comite')
        .select('*')
        .eq('is_active', true)
        .eq('categoria', categoria)
        .order('ordem');

      if (error) {
        throw error;
      }

      return data as CommitteeMember[];
    },
  });
};