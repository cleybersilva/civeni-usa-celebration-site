import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

/**
 * Hook para garantir que a sessão do Supabase está completamente pronta
 * antes de fazer queries. Evita condições de corrida e consultas prematuras.
 */
export function useAuthReady() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(data.session ?? null);
        setReady(true);
      } catch (error) {
        console.error('Error initializing auth session:', error);
        if (mounted) {
          setReady(true); // Marca como pronto mesmo com erro para não bloquear UI
        }
      }
    };

    initialize();

    // Listener para mudanças de autenticação
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  return { ready, session };
}
