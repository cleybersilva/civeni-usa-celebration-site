// Simplified security monitoring without dangerous overrides
export class AntiTamperingGuard {
  private static instance: AntiTamperingGuard;
  private consoleOpenDetected = false;
  
  private constructor() {
    this.initializeProtection();
  }
  
  public static getInstance(): AntiTamperingGuard {
    if (!AntiTamperingGuard.instance) {
      AntiTamperingGuard.instance = new AntiTamperingGuard();
    }
    return AntiTamperingGuard.instance;
  }
  
  private initializeProtection(): void {
    // Passive monitoring only - no dangerous function overrides
    this.detectDevTools();
    this.protectCriticalDOM();
  }
  
  private detectDevTools(): void {
    let devtools = {
      open: false,
      orientation: null as string | null
    };
    
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.onDevToolsDetected();
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }
  
  private protectCriticalDOM(): void {
    // Protect against malicious DOM injection only
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Detect unauthorized script injection
            if (element.tagName === 'SCRIPT' && 
                !element.getAttribute('data-authorized')) {
              element.remove();
              this.onTamperingDetected('Unauthorized script injection');
            }
            
            // Detect phishing forms
            if (element.tagName === 'FORM' && 
                !element.closest('[data-app-form]')) {
              const action = element.getAttribute('action');
              if (action && !action.startsWith(window.location.origin)) {
                element.remove();
                this.onTamperingDetected('Suspicious form detected');
              }
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  private onDevToolsDetected(): void {
    if (this.consoleOpenDetected) return;
    this.consoleOpenDetected = true;
    
    console.clear();
    console.log('%cATENÇÃO!', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%cEste é um recurso do navegador destinado a desenvolvedores.', 'color: red; font-size: 16px;');
    console.log('%cSe alguém lhe disse para copiar e colar algo aqui, é uma tentativa de golpe.', 'color: red; font-size: 16px;');
    console.log('%cFeche esta janela imediatamente para proteger sua conta.', 'color: red; font-size: 16px;');
    
    // Log security event without server call
    this.logSecurityEvent('DevTools opened');
  }
  
  private onTamperingDetected(details: string): void {
    console.error(`Security violation: ${details}`);
    this.logSecurityEvent(`Tampering detected: ${details}`);
  }
  
  private logSecurityEvent(event: string): void {
    // Local logging only - no server calls
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    };
    
    console.warn('Security Event:', securityLog);
  }
  
  public cleanup(): void {
    // No intervals to clean up anymore
  }
}

// Initialize protection automatically
export const initializeAntiTampering = () => {
  if (typeof window !== 'undefined') {
    return AntiTamperingGuard.getInstance();
  }
  return null;
};