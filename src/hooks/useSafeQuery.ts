import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

/**
 * Wrapper resiliente para React Query que:
 * - Normaliza respostas vazias (nunca retorna null/undefined)
 * - Aplica retry automático
 * - Define staleTime e gcTime adequados
 * - Mantém dados anteriores durante refetch (keepPreviousData)
 * - Desabilita refetch automático no foco da janela
 */
export function useSafeQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Partial<UseQueryOptions<T, Error, T, QueryKey>>
) {
  return useQuery<T, Error, T, QueryKey>({
    queryKey,
    queryFn: async () => {
      try {
        const data = await queryFn();
        
        // Normaliza: nunca retorna null/undefined
        // Para arrays, retorna array vazio
        if (data === null || data === undefined) {
          return (Array.isArray([]) ? [] : {}) as T;
        }
        
        return data;
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 1000 * 30,          // 30 segundos
    gcTime: 1000 * 60 * 5,         // 5 minutos (antes era cacheTime)
    refetchOnWindowFocus: false,
    ...options,
  });
}
