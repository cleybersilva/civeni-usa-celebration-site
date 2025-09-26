import { useQuery, useQueryClient } from '@tanstack/react-query';
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
      console.log('Fetching congresso comite data...');
      const { data, error } = await supabase
        .from('congresso_comite')
        .select('*')
        .eq('is_active', true)
        .order('ordem');

      if (error) {
        console.error('Error fetching congresso comite:', error);
        throw error;
      }

      console.log('Fetched congresso comite data:', data);
      return data as CommitteeMember[];
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });
};

export const useCongressoComiteByCategory = (categoria: string) => {
  return useQuery({
    queryKey: ['congresso-comite', categoria],
    queryFn: async () => {
      console.log('Fetching congresso comite data for category:', categoria);
      const { data, error } = await supabase
        .from('congresso_comite')
        .select('*')
        .eq('is_active', true)
        .eq('categoria', categoria)
        .order('ordem');

      if (error) {
        console.error('Error fetching congresso comite for category:', categoria, error);
        throw error;
      }

      console.log('Fetched congresso comite data for category', categoria, ':', data);
      return data as CommitteeMember[];
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });
};