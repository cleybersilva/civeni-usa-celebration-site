import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Avaliador {
  id: string;
  nome: string;
  cargo_pt?: string;
  cargo_en?: string;
  cargo_es?: string;
  instituicao: string;
  foto_url?: string;
  categoria: string;
  especialidade?: string;
  email?: string;
  curriculo_url?: string;
  ordem: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useCongressoAvaliadores = () => {
  return useQuery({
    queryKey: ['congresso-avaliadores'],
    queryFn: async () => {
      console.log('Fetching congresso avaliadores data...');
      const { data, error } = await supabase
        .from('congresso_avaliadores')
        .select('*')
        .eq('is_active', true)
        .order('ordem');

      if (error) {
        console.error('Error fetching congresso avaliadores:', error);
        throw error;
      }

      console.log('Fetched congresso avaliadores data:', data);
      return data as Avaliador[];
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });
};

export const useCongressoAvaliadoresByCategoria = (categoria: string) => {
  return useQuery({
    queryKey: ['congresso-avaliadores', categoria],
    queryFn: async () => {
      console.log('Fetching congresso avaliadores data for category:', categoria);
      const { data, error } = await supabase
        .from('congresso_avaliadores')
        .select('*')
        .eq('is_active', true)
        .eq('categoria', categoria)
        .order('ordem');

      if (error) {
        console.error('Error fetching congresso avaliadores for category:', categoria, error);
        throw error;
      }

      console.log('Fetched congresso avaliadores data for category', categoria, ':', data);
      return data as Avaliador[];
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });
};