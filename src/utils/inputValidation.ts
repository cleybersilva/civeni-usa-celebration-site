// Input validation utilities for security

export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous HTML tags and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(email);
  
  if (!sanitized) {
    return { valid: false, error: 'Email é obrigatório' };
  }
  
  if (sanitized.length > 254) {
    return { valid: false, error: 'Email muito longo' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: 'Email inválido' };
  }
  
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name);
  
  if (!sanitized) {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  
  if (sanitized.length < 2) {
    return { valid: false, error: 'Nome deve ter pelo menos 2 caracteres' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Nome muito longo' };
  }
  
  // Allow only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ\s\-']+$/;
  if (!nameRegex.test(sanitized)) {
    return { valid: false, error: 'Nome contém caracteres inválidos' };
  }
  
  return { valid: true };
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
  const sanitized = sanitizeInput(phone);
  
  if (!sanitized) {
    return { valid: false, error: 'Telefone é obrigatório' };
  }
  
  // Remove all non-digit characters for validation
  const digitsOnly = sanitized.replace(/\D/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { valid: false, error: 'Telefone deve ter entre 10 e 15 dígitos' };
  }
  
  return { valid: true };
};

// Rate limiting for client-side (basic implementation)
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
    const now = Date.now();
    
    // Remove old attempts outside the window
    this.attempts = this.attempts.filter(time => now - time < this.windowMs);
    
    if (this.attempts.length >= this.maxAttempts) {
      return false;
    }
    
    this.attempts.push(now);
    return true;
  }
  
  getTimeUntilReset(): number {
    if (this.attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...this.attempts);
    const resetTime = oldestAttempt + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}