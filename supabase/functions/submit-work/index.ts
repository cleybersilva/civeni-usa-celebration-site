import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
  
  // Required fields - validações básicas apenas
  if (!data.author_name || data.author_name.trim().length < 2) {
    errors.push('Nome do autor é obrigatório');
  }
  
  if (!data.institution || data.institution.trim().length < 2) {
    errors.push('Instituição é obrigatória');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email válido é obrigatório');
  }
  
  if (!data.work_title || data.work_title.trim().length < 5) {
    errors.push('Título do trabalho é obrigatório');
  }
  
  if (!data.abstract || data.abstract.trim().length < 20) {
    errors.push('Resumo é obrigatório');
  }
  
  if (!data.keywords || data.keywords.trim().length < 5) {
    errors.push('Palavras-chave são obrigatórias');
  }
  
  if (!data.thematic_area || data.thematic_area.trim().length < 2) {
    errors.push('Área temática é obrigatória');
  }
  
  return { isValid: errors.length === 0, errors };
}

function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim();
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
      submission_kind: body.submission_kind || 'artigo', // Add submission_kind
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