import { supabase } from '@/integrations/supabase/client';

// Script para sincronizar a categoria VCCU Promocional com Stripe após atualização de preço
export const syncVCCUPromocionalCategory = async () => {
  const categoryId = '15418895-0c45-4105-a47b-c761839cfe25'; // ID da categoria Aluno(a) VCCU – Promocional
  
  try {
    console.log('Sincronizando categoria VCCU Promocional com Stripe...');
    
    const { data, error } = await supabase.functions.invoke('sync-category-stripe', {
      body: { categoryId }
    });

    if (error) {
      console.error('Erro ao sincronizar com Stripe:', error);
      return { success: false, error: error.message };
    }

    console.log('Categoria sincronizada com sucesso:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Erro na sincronização:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

// Execute a sincronização automaticamente quando este módulo for importado
if (typeof window !== 'undefined') {
  // Execute apenas no browser
  syncVCCUPromocionalCategory().then(result => {
    if (result.success) {
      console.log('✅ Categoria VCCU Promocional sincronizada com Stripe - Novo valor: R$ 75,00');
    } else {
      console.error('❌ Erro na sincronização:', result.error);
    }
  });
}