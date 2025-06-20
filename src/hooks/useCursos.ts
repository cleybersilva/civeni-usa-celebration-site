
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Curso {
  id: string;
  nome_curso: string;
}

interface Turma {
  id: string;
  id_curso: string;
  nome_turma: string;
}

export const useCursos = () => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('nome_curso', { ascending: true });

      if (error) throw error;
      setCursos(data || []);
    } catch (error: any) {
      console.error('Error fetching cursos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { cursos, loading, error };
};

export const useTurmas = (cursoId?: string) => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cursoId) {
      fetchTurmas(cursoId);
    } else {
      setTurmas([]);
    }
  }, [cursoId]);

  const fetchTurmas = async (cursoId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .eq('id_curso', cursoId)
        .order('nome_turma', { ascending: true });

      if (error) throw error;
      setTurmas(data || []);
    } catch (error: any) {
      console.error('Error fetching turmas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { turmas, loading, error };
};
