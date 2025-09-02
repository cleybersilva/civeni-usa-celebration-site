import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Lote {
  id: string;
  nome: string;
  price_cents: number;
  dt_inicio: string;
  dt_fim: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useLotes = () => {
  const [loteVigente, setLoteVigente] = useState<Lote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoteVigente = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('v_lote_atual')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setLoteVigente(data);
    } catch (err: any) {
      console.error('Erro ao buscar lote vigente:', err);
      setError(err.message || 'Erro ao carregar lote vigente');
      setLoteVigente(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoteVigente();

    // Configurar realtime para sincronização automática
    const channel = supabase.channel('lotes-sync');
    
    channel.on('broadcast', { event: 'REFRESH' }, () => {
      fetchLoteVigente();
    });

    // Também escutar mudanças diretas na tabela lotes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'lotes'
      },
      () => {
        fetchLoteVigente();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    loteVigente,
    loading,
    error,
    refetch: fetchLoteVigente
  };
};