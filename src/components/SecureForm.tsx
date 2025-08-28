import React, { ReactNode, FormEvent } from 'react';
import { useSecurityContext } from './SecurityProvider';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SecureFormProps {
  children: ReactNode;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  className?: string;
  submitText?: string;
  isLoading?: boolean;
  rateLimitKey?: string;
  maxAttempts?: number;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  children,
  onSubmit,
  className = '',
  submitText = 'Enviar',
  isLoading = false,
  rateLimitKey = 'form_submission',
  maxAttempts = 5
}) => {
  const { csrfToken, checkRateLimit, submitSecureForm } = useSecurityContext();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Verificar rate limiting
    if (!checkRateLimit(rateLimitKey, maxAttempts)) {
      throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
    }

    try {
      const formData = new FormData(e.currentTarget);
      const data: Record<string, any> = {};
      
      // Converter FormData para objeto
      formData.forEach((value, key) => {
        data[key] = value;
      });
      
      // Adicionar token CSRF
      data._csrf = csrfToken;
      
      // Sanitizar dados usando o contexto de segurança
      const sanitizedData = await submitSecureForm(data);
      
      // Chamar callback do usuário
      await onSubmit(sanitizedData);
      
    } catch (error) {
      console.error('Erro na submissão do formulário:', error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Token CSRF oculto */}
      <input type="hidden" name="_csrf" value={csrfToken} />
      
      {children}
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full mt-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          submitText
        )}
      </Button>
    </form>
  );
};