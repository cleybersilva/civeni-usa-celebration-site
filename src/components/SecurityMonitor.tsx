import { useEffect } from 'react';
import { toast } from 'sonner';

export const SecurityMonitor = () => {
  useEffect(() => {
    // Passive security monitoring only - no dangerous overrides

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
      observer.disconnect();
    };
  }, []);

  return null; // Componente sem renderização
};