import { useEffect } from 'react';
import { setSecurityHeaders, securityValidator } from '@/utils/securityValidation';

export const useSecurityHeaders = () => {
  useEffect(() => {
    // Definir headers de segurança
    setSecurityHeaders();

    // Gerar e armazenar token CSRF
    const generateCSRFToken = () => {
      const token = securityValidator.generateCSRFToken();
      sessionStorage.setItem('csrf_token', token);
      return token;
    };

    // Verificar se já existe token CSRF válido
    const existingToken = sessionStorage.getItem('csrf_token');
    if (!existingToken || existingToken.length !== 64) {
      generateCSRFToken();
    }

    // Renovar token CSRF a cada 30 minutos
    const interval = setInterval(() => {
      generateCSRFToken();
    }, 30 * 60 * 1000);

    // Detectar tentativas de manipulação do DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Detectar scripts inseridos dinamicamente
              if (element.tagName === 'SCRIPT') {
                console.warn('Script insertion detected - removing for security');
                element.remove();
              }
              
              // Detectar iframes suspeitos
              if (element.tagName === 'IFRAME') {
                const src = element.getAttribute('src');
                if (src && !securityValidator.validateUrl(src)) {
                  console.warn('Suspicious iframe detected - removing');
                  element.remove();
                }
              }
            }
          });
        }
      });
    });

    // Monitorar mudanças no DOM
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return {
    getCSRFToken: () => sessionStorage.getItem('csrf_token') || '',
    regenerateCSRFToken: () => {
      const token = securityValidator.generateCSRFToken();
      sessionStorage.setItem('csrf_token', token);
      return token;
    }
  };
};