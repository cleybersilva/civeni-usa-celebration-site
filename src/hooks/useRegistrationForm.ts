
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { RegistrationFormData } from '@/types/registration';
import { getCurrency } from '@/utils/registrationUtils';

export const useRegistrationForm = (registrationType?: 'presencial' | 'online') => {
  const { i18n, t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    fullName: '',
    participantType: '',
    categoryId: '',
    cursoId: '',
    turmaId: '',
    couponCode: ''
  });

  const validateCoupon = async (couponCode: string) => {
    if (!couponCode) return null;
    
    try {
      const { data, error } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      
      if (data && (data.usage_limit === null || (data.used_count || 0) < data.usage_limit)) {
        return { is_valid: true, coupon_id: data.id, category_id: data.category_id };
      }
      
      return { is_valid: false };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { is_valid: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent, currentBatch: any) => {
    e.preventDefault();
    if (!currentBatch || !formData.categoryId) return;
    
    if (formData.participantType === 'vccu_student' && (!formData.cursoId || !formData.turmaId)) {
      setError('Para alunos da VCCU, os campos Curso e Turma são obrigatórios.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let validCoupon = null;
      if (formData.couponCode) {
        validCoupon = await validateCoupon(formData.couponCode);
        if (!validCoupon?.is_valid) {
          throw new Error(t('registration.errors.invalidCoupon'));
        }
      }

      console.log("=== STARTING REGISTRATION ===");
      console.log("Form data:", formData);
      console.log("Current batch:", currentBatch);

      try {
        console.log("=== CALLING EDGE FUNCTION ===");
        
        const { data, error } = await supabase.functions.invoke('create-registration-payment', {
          body: {
            email: formData.email,
            fullName: formData.fullName,
            categoryId: formData.categoryId,
            batchId: currentBatch.id,
            couponCode: formData.couponCode || '',
            cursoId: formData.cursoId || null,
            turmaId: formData.turmaId || null,
            participantType: formData.participantType,
            registrationType: registrationType || 'geral',
            currency: getCurrency(i18n.language)
          }
        });

        console.log("=== EDGE FUNCTION RESPONSE ===");
        console.log("Data:", data);
        console.log("Error:", error);

        if (error) {
          console.error("Edge function error:", error);
          throw new Error(`Erro na função: ${error.message || JSON.stringify(error)}`);
        }

        if (!data) {
          throw new Error('Nenhuma resposta recebida do servidor');
        }

        if (!data.success) {
          throw new Error(data.error || 'Erro desconhecido no servidor');
        }

        console.log("=== PROCESSING RESPONSE ===");
        
        if (data.payment_required === false) {
          console.log("Free registration completed");
          alert('Inscrição gratuita realizada com sucesso!');
          setFormData({ 
            email: '', 
            fullName: '', 
            participantType: '',
            categoryId: '', 
            cursoId: '',
            turmaId: '',
            couponCode: '' 
          });
        } else if (data.url) {
          console.log("Redirecting to Stripe URL:", data.url);
          // Redirect immediately to Stripe
          window.location.href = data.url;
        } else {
          throw new Error('URL de pagamento não foi fornecida pelo servidor');
        }

      } catch (functionError: any) {
        console.error("Function error:", functionError);
        throw functionError;
      }
    } catch (error: any) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Erro ao processar inscrição';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    loading,
    error,
    setError,
    handleSubmit
  };
};
