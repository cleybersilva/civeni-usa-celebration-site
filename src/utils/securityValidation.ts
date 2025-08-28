// Utilitários de segurança para validação e sanitização
import DOMPurify from 'dompurify';

// Patterns perigosos para detectar tentativas de injeção
const DANGEROUS_PATTERNS = [
  // SQL Injection
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
  // Script injection
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  // Command injection
  /(\||&|;|\$\(|\`)/g,
  // Path traversal
  /\.\.(\/|\\)/g,
  // HTML injection
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<form[^>]*>/gi,
];

// Caracteres perigosos que devem ser removidos/escapados
const DANGEROUS_CHARS = /[<>\"'`\{\}\[\]\\]/g;

export const securityValidator = {
  // Sanitizar string removendo conteúdo perigoso
  sanitizeString: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    
    // Remove scripts e HTML perigoso
    let sanitized = DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
    
    // Remove patterns perigosos
    DANGEROUS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // Escape caracteres perigosos
    sanitized = sanitized.replace(DANGEROUS_CHARS, (char) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '{': '&#x7B;',
        '}': '&#x7D;',
        '[': '&#x5B;',
        ']': '&#x5D;',
        '\\': '&#x5C;'
      };
      return escapeMap[char] || char;
    });
    
    return sanitized.trim();
  },

  // Validar email com regex rigorosa
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const sanitized = securityValidator.sanitizeString(email);
    return emailRegex.test(sanitized) && sanitized.length <= 254;
  },

  // Validar URL para prevenir redirecionamentos maliciosos
  validateUrl: (url: string): boolean => {
    try {
      const sanitized = securityValidator.sanitizeString(url);
      const urlObj = new URL(sanitized);
      
      // Permitir apenas HTTPS e HTTP
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Bloquear IPs privados e localhost
      const hostname = urlObj.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      ) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },

  // Validar entrada de texto geral
  validateTextInput: (input: string, maxLength: number = 1000): string => {
    if (!input || typeof input !== 'string') return '';
    
    const sanitized = securityValidator.sanitizeString(input);
    
    // Verificar tamanho
    if (sanitized.length > maxLength) {
      throw new Error(`Entrada muito longa. Máximo ${maxLength} caracteres.`);
    }
    
    // Detectar tentativas de injeção
    const containsDangerousPattern = DANGEROUS_PATTERNS.some(pattern => 
      pattern.test(input)
    );
    
    if (containsDangerousPattern) {
      throw new Error('Entrada contém conteúdo não permitido.');
    }
    
    return sanitized;
  },

  // Validar número de telefone
  validatePhone: (phone: string): boolean => {
    const sanitized = securityValidator.sanitizeString(phone);
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = sanitized.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
  },

  // Gerar token CSRF
  generateCSRFToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Validar token CSRF
  validateCSRFToken: (token: string, storedToken: string): boolean => {
    if (!token || !storedToken || typeof token !== 'string' || typeof storedToken !== 'string') {
      return false;
    }
    return token === storedToken && token.length === 64;
  },

  // Rate limiting simples baseado em localStorage
  checkRateLimit: (key: string, maxAttempts: number = 5, windowMs: number = 300000): boolean => {
    try {
      const now = Date.now();
      const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
      
      // Filtrar tentativas dentro da janela de tempo
      const recentAttempts = attempts.filter((timestamp: number) => 
        now - timestamp < windowMs
      );
      
      if (recentAttempts.length >= maxAttempts) {
        return false;
      }
      
      // Adicionar nova tentativa
      recentAttempts.push(now);
      localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
      
      return true;
    } catch {
      // Se houver erro com localStorage, permitir (fail-safe)
      return true;
    }
  },

  // Limpar dados de rate limiting
  clearRateLimit: (key: string): void => {
    try {
      localStorage.removeItem(`rate_limit_${key}`);
    } catch {
      // Ignorar erros
    }
  }
};

// Security headers setup - No longer needed as CSP is handled by server headers
export const setSecurityHeaders = (): void => {
  // CSP is now handled by server headers in public/_headers and .htaccess
  // This prevents conflicts and ensures consistent security policy
};

// Middleware de segurança para formulários
export const secureFormSubmission = async (
  formData: Record<string, any>,
  csrfToken?: string
): Promise<Record<string, any>> => {
  // Validar CSRF token se fornecido
  if (csrfToken) {
    const storedToken = sessionStorage.getItem('csrf_token');
    if (!securityValidator.validateCSRFToken(csrfToken, storedToken || '')) {
      throw new Error('Token de segurança inválido. Recarregue a página.');
    }
  }

  // Sanitizar todos os campos do formulário
  const sanitizedData: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitizedData[key] = securityValidator.validateTextInput(value, 2000);
    } else if (typeof value === 'number') {
      // Validar números
      if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
        throw new Error(`Valor numérico inválido para ${key}`);
      }
      sanitizedData[key] = value;
    } else if (typeof value === 'boolean') {
      sanitizedData[key] = Boolean(value);
    } else if (value === null || value === undefined) {
      sanitizedData[key] = null;
    } else {
      // Para outros tipos, converter para string e sanitizar
      sanitizedData[key] = securityValidator.validateTextInput(String(value), 2000);
    }
  }

  return sanitizedData;
};