import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Submission {
  id: string;
  tipo: 'artigo' | 'consorcio';
  titulo: string;
  resumo?: string;
  area_tematica?: string;
  palavras_chave?: string[];
  autor_principal: string;
  autores?: any;
  email: string;
  telefone?: string;
  whatsapp?: string;
  instituicao?: string;
  arquivo_path: string;
  arquivo_mime: string;
  arquivo_size: number;
  status: 'recebido' | 'em_analise' | 'validado' | 'invalidado' | 'arquivado';
  status_motivo?: string;
  validated_at?: string;
  validated_by?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubmissionFilters {
  q?: string;
  tipo?: string;
  status?: string;
  area_tematica?: string;
  date_from?: string;
  date_to?: string;
}

export const useSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SubmissionFilters>({});

  // Helper para configurar sessão admin
  const setupAdminSession = async () => {
    const savedSession = localStorage.getItem('adminSession');
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      if (sessionData.session_token) {
        await supabase.rpc('set_current_user_email_secure', {
          user_email: sessionData.user.email,
          session_token: sessionData.session_token
        });
      }
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      // Configurar sessão admin e verificar se foi bem-sucedida
      const savedSession = localStorage.getItem('adminSession');
      if (!savedSession) {
        console.error('Sessão admin não encontrada');
        toast.error('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const sessionData = JSON.parse(savedSession);
      if (!sessionData.session_token) {
        console.error('Token de sessão inválido');
        toast.error('Sessão inválida. Faça login novamente.');
        setLoading(false);
        return;
      }

      // Configurar sessão admin
      const { data: sessionCheck, error: sessionError } = await supabase.rpc('set_current_user_email_secure', {
        user_email: sessionData.user.email,
        session_token: sessionData.session_token
      });

      if (sessionError || !sessionCheck) {
        console.error('Erro ao configurar sessão:', sessionError);
        toast.error('Erro de autenticação. Faça login novamente.');
        setLoading(false);
        return;
      }

      let query = supabase
        .from('submissions')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.q) {
        query = query.or(`titulo.ilike.%${filters.q}%,autor_principal.ilike.%${filters.q}%,email.ilike.%${filters.q}%`);
      }
      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.area_tematica) {
        query = query.eq('area_tematica', filters.area_tematica);
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSubmissions((data || []) as Submission[]);
    } catch (error: any) {
      console.error('Erro ao buscar submissões:', error);
      toast.error('Erro ao carregar submissões');
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (path: string): Promise<string | null> => {
    try {
      console.log('Iniciando getSignedUrl para:', path);
      await setupAdminSession();
      
      // Tentar URL pública primeiro (bucket é público)
      const { data: publicData } = supabase.storage
        .from('civeni-submissoes')
        .getPublicUrl(path);

      if (publicData?.publicUrl) {
        console.log('URL pública gerada com sucesso:', publicData.publicUrl);
        
        // Testar se a URL é acessível
        try {
          const testResponse = await fetch(publicData.publicUrl, { method: 'HEAD' });
          console.log('Teste de URL pública - Status:', testResponse.status);
          
          if (testResponse.ok) {
            return publicData.publicUrl;
          }
        } catch (testError) {
          console.warn('URL pública não acessível, tentando URL assinada:', testError);
        }
      }

      // Fallback para URL assinada se a pública falhar
      console.log('Tentando gerar URL assinada...');
      const { data: signedData, error } = await supabase.storage
        .from('civeni-submissoes')
        .createSignedUrl(path, 3600);

      if (error) {
        console.error('Erro ao gerar URL assinada:', error);
        throw error;
      }

      console.log('URL assinada gerada com sucesso:', signedData.signedUrl);
      return signedData.signedUrl;
    } catch (error: any) {
      console.error('Erro completo em getSignedUrl:', error);
      toast.error('Erro ao gerar link: ' + (error.message || 'Erro desconhecido'));
      return null;
    }
  };

  const updateSubmission = async (id: string, updates: Partial<Submission>) => {
    try {
      await setupAdminSession();
      
      const { error } = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Submissão atualizada com sucesso');
      await fetchSubmissions();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar submissão:', error);
      toast.error('Erro ao atualizar submissão');
      return false;
    }
  };

  const validateSubmission = async (id: string) => {
    try {
      await setupAdminSession();
      
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'validado',
          validated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Chamar edge function para enviar notificações
      const { error: notifyError } = await supabase.functions.invoke('notify-validation', {
        body: { submission_id: id }
      });

      if (notifyError) {
        console.error('Erro ao enviar notificações:', notifyError);
        toast.warning('Submissão validada, mas houve erro ao enviar notificações');
      } else {
        toast.success('Submissão validada e notificações enviadas!');
      }

      await fetchSubmissions();
      return true;
    } catch (error: any) {
      console.error('Erro ao validar submissão:', error);
      toast.error('Erro ao validar submissão');
      return false;
    }
  };

  const invalidateSubmission = async (id: string, motivo: string) => {
    try {
      await setupAdminSession();
      
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'invalidado',
          status_motivo: motivo,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Submissão invalidada');
      await fetchSubmissions();
      return true;
    } catch (error: any) {
      console.error('Erro ao invalidar submissão:', error);
      toast.error('Erro ao invalidar submissão');
      return false;
    }
  };

  const archiveSubmission = async (id: string) => {
    try {
      await setupAdminSession();
      
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'arquivado' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Submissão arquivada');
      await fetchSubmissions();
      return true;
    } catch (error: any) {
      console.error('Erro ao arquivar submissão:', error);
      toast.error('Erro ao arquivar submissão');
      return false;
    }
  };

  const restoreSubmission = async (id: string) => {
    try {
      await setupAdminSession();
      
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'em_analise' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Submissão restaurada');
      await fetchSubmissions();
      return true;
    } catch (error: any) {
      console.error('Erro ao restaurar submissão:', error);
      toast.error('Erro ao restaurar submissão');
      return false;
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [filters]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions'
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    submissions,
    loading,
    filters,
    setFilters,
    getSignedUrl,
    updateSubmission,
    validateSubmission,
    invalidateSubmission,
    archiveSubmission,
    restoreSubmission,
    refetch: fetchSubmissions,
  };
};
