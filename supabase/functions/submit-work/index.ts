import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://wdkeqxfglmritghmakma.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting for work submissions
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const RATE_LIMIT_MAX = 3; // max 3 submissions per window

function checkRateLimit(clientIP: string, email: string): boolean {
  const now = Date.now();
  const key = `${clientIP}:${email}`;
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  current.count++;
  return true;
}

function validateWorkSubmission(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!data.author_name || data.author_name.trim().length < 2) {
    errors.push('Nome do autor é obrigatório (mín. 2 caracteres)');
  }
  
  if (!data.institution || data.institution.trim().length < 2) {
    errors.push('Instituição é obrigatória (mín. 2 caracteres)');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email válido é obrigatório');
  }
  
  if (!data.work_title || data.work_title.trim().length < 10) {
    errors.push('Título do trabalho é obrigatório (mín. 10 caracteres)');
  }
  
  if (!data.abstract || data.abstract.trim().length < 50) {
    errors.push('Resumo é obrigatório (mín. 50 caracteres)');
  }
  
  if (!data.keywords || data.keywords.trim().length < 10) {
    errors.push('Palavras-chave são obrigatórias (mín. 10 caracteres)');
  }
  
  if (!data.thematic_area || data.thematic_area.trim().length < 2) {
    errors.push('Área temática é obrigatória');
  }
  
  // Length limits
  if (data.author_name && data.author_name.length > 100) errors.push('Nome do autor muito longo (máx. 100 caracteres)');
  if (data.institution && data.institution.length > 200) errors.push('Instituição muito longa (máx. 200 caracteres)');
  if (data.work_title && data.work_title.length > 200) errors.push('Título muito longo (máx. 200 caracteres)');
  if (data.abstract && data.abstract.length > 5000) errors.push('Resumo muito longo (máx. 5000 caracteres)');
  if (data.keywords && data.keywords.length > 500) errors.push('Palavras-chave muito longas (máx. 500 caracteres)');
  if (data.thematic_area && data.thematic_area.length > 100) errors.push('Área temática muito longa (máx. 100 caracteres)');
  
  // Suspicious content detection
  const suspiciousPatterns = [
    /\b(script|javascript|vbscript|onload|onerror|eval|function|document\.)\b/gi,
    /<[^>]*>/g, // HTML tags
    /\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi // SQL injection
  ];
  
  const textFields = [data.author_name, data.institution, data.work_title, data.abstract, data.keywords, data.thematic_area];
  
  for (const field of textFields) {
    if (field) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(field)) {
          errors.push('Conteúdo suspeito detectado');
          break;
        }
      }
    }
  }
  
  // Email domain validation (block disposable email services)
  const suspiciousEmailDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com', 
    'mailinator.com', 'throwaway.email', 'fake.com', 'test.com'
  ];
  
  if (data.email) {
    const emailDomain = data.email.split('@')[1]?.toLowerCase();
    if (suspiciousEmailDomains.includes(emailDomain)) {
      errors.push('Por favor, utilize um email institucional válido');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>\"'`{}[\]\\]/g, '') // Remove dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 5000); // Max length
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Método não permitido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!checkRateLimit(clientIP, email || 'no-email')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Muitas tentativas. Aguarde 5 minutos antes de tentar novamente.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    // Validate submission data
    const validation = validateWorkSubmission(body);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Dados inválidos: ${validation.errors.join(', ')}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Sanitize and insert the work submission
    const sanitizedData = {
      author_name: sanitizeText(body.author_name),
      institution: sanitizeText(body.institution),
      email: body.email.toLowerCase().trim(),
      work_title: sanitizeText(body.work_title),
      abstract: sanitizeText(body.abstract),
      keywords: sanitizeText(body.keywords),
      thematic_area: sanitizeText(body.thematic_area),
      status: 'pending', // Always set to pending
    };

    console.log(`[SUBMIT-WORK] Processing submission from ${sanitizedData.email}`);

    const { data, error } = await supabase
      .from('work_submissions')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('[SUBMIT-WORK] Database error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro interno. Tente novamente em alguns minutos.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`[SUBMIT-WORK] Submission ${data.id} created successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Trabalho submetido com sucesso!',
      id: data.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[SUBMIT-WORK] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});