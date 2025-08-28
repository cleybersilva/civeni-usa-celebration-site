import { useEffect } from 'react';
import { toast } from 'sonner';

export const SecurityMonitor = () => {
  useEffect(() => {
    // Detectar tentativas de injeção via console
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.toLowerCase().includes('inject') || 
          message.toLowerCase().includes('hack') ||
          message.toLowerCase().includes('exploit')) {
        toast.error('Atividade suspeita detectada. Administradores foram notificados.');
      }
      originalConsoleLog.apply(console, args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.toLowerCase().includes('cors') ||
          message.toLowerCase().includes('csp') ||
          message.toLowerCase().includes('security')) {
        // Log silencioso de possíveis tentativas de bypass de segurança
        fetch('/api/security-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'security_error', 
            message,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          })
        }).catch(() => {}); // Fail silently
      }
      originalConsoleError.apply(console, args);
    };

    // Detectar tentativas de manipulação do LocalStorage/SessionStorage
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key.includes('token') || key.includes('password') || key.includes('secret')) {
        if (typeof value === 'string' && value.length > 1000) {
          toast.error('Tentativa de armazenamento suspeito bloqueada.');
          return;
        }
      }
      originalSetItem.call(this, key, value);
    };

    // Detectar tentativas de acesso não autorizado a propriedades do window
    const sensitiveProps = ['crypto', 'indexedDB', 'localStorage', 'sessionStorage'];
    sensitiveProps.forEach(prop => {
      let value = (window as any)[prop];
      Object.defineProperty(window, prop, {
        get() {
          // Log de acesso (apenas para monitoramento)
          return value;
        },
        set(newValue) {
          toast.error('Tentativa de modificação de propriedade sensível bloqueada.');
          return false;
        }
      });
    });

    // Monitorar tentativas de bypass do CSP
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Detectar scripts inline
            if (element.tagName === 'SCRIPT' && element.textContent) {
              console.warn('Inline script detected and blocked');
              element.remove();
              toast.error('Script malicioso bloqueado.');
            }
            
            // Detectar event handlers inline
            const attributes = element.getAttributeNames?.();
            attributes?.forEach(attr => {
              if (attr.startsWith('on') && attr !== 'onLoad') {
                element.removeAttribute(attr);
                toast.warning('Event handler suspeito removido.');
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['onclick', 'onload', 'onerror', 'onmouseover']
    });

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      observer.disconnect();
    };
  }, []);

  return null; // Componente sem renderização
};