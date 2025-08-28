// Proteção contra manipulação e debug não autorizado
export class AntiTamperingGuard {
  private static instance: AntiTamperingGuard;
  private debuggerDetectionInterval: NodeJS.Timeout | null = null;
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
    // Detectar ferramentas de desenvolvedor abertas
    this.detectDevTools();
    
    // Proteger contra debugger
    this.protectAgainstDebugger();
    
    // Monitorar modificações no DOM crítico
    this.protectCriticalDOM();
    
    // Proteger funções críticas
    this.protectCriticalFunctions();
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
    
    // Método alternativo de detecção
    let element = document.createElement('div');
    element.id = 'devtools-detector';
    Object.defineProperty(element, 'id', {
      get: () => {
        this.onDevToolsDetected();
        return 'devtools-detector';
      }
    });
    
    console.log(element);
  }
  
  private protectAgainstDebugger(): void {
    // Inserir debugger statements em pontos críticos
    this.debuggerDetectionInterval = setInterval(() => {
      const before = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const after = performance.now();
      
      if (after - before > 100) {
        this.onDebuggerDetected();
      }
    }, 1000);
  }
  
  private protectCriticalDOM(): void {
    // Proteger elementos críticos como forms de login/pagamento
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Detectar injeção de scripts maliciosos
            if (element.tagName === 'SCRIPT' && 
                !element.getAttribute('data-authorized')) {
              element.remove();
              this.onTamperingDetected('Unauthorized script injection');
            }
            
            // Detectar elementos de phishing
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
  
  private protectCriticalFunctions(): void {
    // Proteger fetch e XMLHttpRequest
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0] as string;
      
      // Verificar se a requisição é para domínios autorizados
      if (typeof url === 'string' && !this.isAuthorizedDomain(url)) {
        this.onTamperingDetected(`Unauthorized request to: ${url}`);
        throw new Error('Unauthorized request blocked');
      }
      
      return originalFetch.apply(window, args);
    };
    
    // Proteger eval e Function constructor
    const originalEval = window.eval;
    window.eval = (code: string) => {
      this.onTamperingDetected('eval() usage detected');
      throw new Error('eval() is disabled for security');
    };
    
    const BuiltinFunction = window.Function;
    window.Function = function(...args: any[]) {
      this.onTamperingDetected('Function constructor usage detected');
      throw new Error('Function constructor is disabled for security');
    }.bind(this);
  }
  
  private isAuthorizedDomain(url: string): boolean {
    const authorizedDomains = [
      window.location.origin,
      'https://wdkeqxfglmritghmakma.supabase.co',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.google.com',
      'https://www.youtube.com',
      'https://youtube.com',
      'https://maps.google.com'
    ];
    
    try {
      const urlObj = new URL(url, window.location.origin);
      return authorizedDomains.some(domain => 
        urlObj.origin === domain || url.startsWith('/')
      );
    } catch {
      return false;
    }
  }
  
  private onDevToolsDetected(): void {
    if (this.consoleOpenDetected) return;
    this.consoleOpenDetected = true;
    
    console.clear();
    console.log('%cATENÇÃO!', 'color: red; font-size: 50px; font-weight: bold;');
    console.log('%cEste é um recurso do navegador destinado a desenvolvedores.', 'color: red; font-size: 16px;');
    console.log('%cSe alguém lhe disse para copiar e colar algo aqui, é uma tentativa de golpe.', 'color: red; font-size: 16px;');
    console.log('%cFeche esta janela imediatamente para proteger sua conta.', 'color: red; font-size: 16px;');
    
    // Log de segurança (não bloquear completamente para não afetar desenvolvimento legítimo)
    this.logSecurityEvent('DevTools opened');
  }
  
  private onDebuggerDetected(): void {
    console.warn('Debugger detection bypassed - monitoring continues');
    this.logSecurityEvent('Debugger usage detected');
  }
  
  private onTamperingDetected(details: string): void {
    console.error(`Security violation: ${details}`);
    this.logSecurityEvent(`Tampering detected: ${details}`);
    
    // Em produção, você pode querer redirecionar ou bloquear
    if (process.env.NODE_ENV === 'production') {
      // window.location.href = '/security-warning';
    }
  }
  
  private logSecurityEvent(event: string): void {
    // Log local (pode ser enviado para servidor de segurança)
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    };
    
    console.warn('Security Event:', securityLog);
    
    // Em produção, enviar para servidor de monitoramento
    // fetch('/api/security-log', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(securityLog)
    // }).catch(() => {}); // Fail silently
  }
  
  public cleanup(): void {
    if (this.debuggerDetectionInterval) {
      clearInterval(this.debuggerDetectionInterval);
    }
  }
}

// Inicializar proteção automaticamente
export const initializeAntiTampering = () => {
  if (typeof window !== 'undefined') {
    return AntiTamperingGuard.getInstance();
  }
  return null;
};