import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSecurityHeaders } from '@/hooks/useSecurityHeaders';
import { securityValidator } from '@/utils/securityValidation';

interface SecurityContextType {
  csrfToken: string;
  checkRateLimit: (key: string, maxAttempts?: number) => boolean;
  submitSecureForm: (data: Record<string, any>) => Promise<Record<string, any>>;
  regenerateCSRFToken: () => string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext deve ser usado dentro de SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { getCSRFToken, regenerateCSRFToken } = useSecurityHeaders();
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    setCsrfToken(getCSRFToken());
  }, [getCSRFToken]);

  const checkRateLimit = (key: string, maxAttempts: number = 5): boolean => {
    return securityValidator.checkRateLimit(key, maxAttempts);
  };

  const submitSecureForm = async (data: Record<string, any>): Promise<Record<string, any>> => {
    const currentToken = getCSRFToken();
    
    // Verificar rate limiting
    if (!checkRateLimit('form_submission', 10)) {
      throw new Error('Muitas tentativas. Tente novamente em alguns minutos.');
    }

    try {
      const sanitizedData = await import('@/utils/securityValidation').then(
        ({ secureFormSubmission }) => secureFormSubmission(data, currentToken)
      );
      
      return sanitizedData;
    } catch (error) {
      console.error('Security validation failed:', error);
      throw error;
    }
  };

  const handleRegenerateToken = (): string => {
    const newToken = regenerateCSRFToken();
    setCsrfToken(newToken);
    return newToken;
  };

  const securityContextValue: SecurityContextType = {
    csrfToken,
    checkRateLimit,
    submitSecureForm,
    regenerateCSRFToken: handleRegenerateToken,
  };

  return (
    <SecurityContext.Provider value={securityContextValue}>
      {children}
    </SecurityContext.Provider>
  );
};