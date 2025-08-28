import { securityValidator } from './securityValidation';

export const sanitizeInput = (input: string): string => {
  return securityValidator.validateTextInput(input);
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  try {
    const sanitized = securityValidator.sanitizeString(email);
    
    if (!sanitized) {
      return { valid: false, error: 'Email é obrigatório' };
    }
    
    if (!securityValidator.validateEmail(sanitized)) {
      return { valid: false, error: 'Email inválido' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Email inválido' };
  }
};

export const validateName = (name: string): { valid: boolean; error?: string } => {
  try {
    const sanitized = securityValidator.validateTextInput(name, 100);
    
    if (!sanitized) {
      return { valid: false, error: 'Nome é obrigatório' };
    }
    
    if (sanitized.length < 2) {
      return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
    }
    
    // Allow only letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-ZàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s\-']+$/;
    if (!nameRegex.test(sanitized)) {
      return { valid: false, error: 'Nome contém caracteres inválidos' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Nome inválido' };
  }
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Senha é obrigatória' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Senha deve ter pelo menos 8 caracteres' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Senha muito longa' };
  }
  
  // Check for at least one lowercase, uppercase, number
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLower || !hasUpper || !hasNumber) {
    return { 
      valid: false, 
      error: 'Senha deve conter pelo menos uma letra minúscula, maiúscula e um número' 
    };
  }
  
  return { valid: true };
};

export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  try {
    const sanitized = securityValidator.sanitizeString(phone);
    
    if (!sanitized) {
      return { valid: false, error: 'Telefone é obrigatório' };
    }
    
    if (!securityValidator.validatePhone(sanitized)) {
      return { valid: false, error: 'Telefone deve ter entre 10 e 15 dígitos' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Telefone inválido' };
  }
};

// Rate limiting for client-side (basic implementation) - mantendo compatibilidade
export class RateLimiter {
  private static instances: Map<string, RateLimiter> = new Map();
  private attempts: number[] = [];
  
  constructor(private key: string, private maxAttempts: number, private windowMs: number) {}
  
  static getInstance(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): RateLimiter {
    if (!this.instances.has(key)) {
      this.instances.set(key, new RateLimiter(key, maxAttempts, windowMs));
    }
    return this.instances.get(key)!;
  }
  
  isAllowed(): boolean {
    return securityValidator.checkRateLimit(this.key, this.maxAttempts, this.windowMs);
  }
  
  getTimeUntilReset(): number {
    if (this.attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...this.attempts);
    const resetTime = oldestAttempt + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}