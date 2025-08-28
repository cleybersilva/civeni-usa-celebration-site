import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://wdkeqxfglmritghmakma.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const RATE_LIMIT_MAX = 3; // max work submissions per window

function checkRateLimit(clientIP: string, userEmail: string): boolean {
  const now = Date.now();
  const key = `${clientIP}:${userEmail}`;
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

function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  // Remove dangerous patterns
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  try {
    const body = await req.json().catch(() => ({}));
    const {
      author_name,
      institution,
      email,
      work_title,
      abstract,
      keywords,
      thematic_area
    } = body;

    // Validate required fields
    if (!author_name || !institution || !email || !work_title || !abstract) {
      return new Response(JSON.stringify({ success: false, error: 'Campos obrigatórios não preenchidos' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'Email inválido' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check rate limiting
    if (!checkRateLimit(clientIP, email)) {
      return new Response(JSON.stringify({ success: false, error: 'Muitas submissões. Tente novamente em alguns minutos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      author_name: sanitizeInput(author_name, 200),
      institution: sanitizeInput(institution, 200),
      email: sanitizeInput(email, 100),
      work_title: sanitizeInput(work_title, 300),
      abstract: sanitizeInput(abstract, 5000),
      keywords: sanitizeInput(keywords || '', 500),
      thematic_area: sanitizeInput(thematic_area, 100),
      status: 'pending',
    };

    // Use service role to insert data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from('work_submissions')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao salvar submissão. Tente novamente.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Log successful submission for admin notification
    await supabase
      .from('alert_logs')
      .insert([{
        alert_type: 'work_submission',
        recipient_type: 'email',
        recipient: 'cleyber.silva@live.com',
        message: `Nova submissão de trabalho: ${sanitizedData.work_title} por ${sanitizedData.author_name}`,
        triggered_by_id: data.id
      }])
      .catch(() => {}); // Don't fail if logging fails

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Trabalho submetido com sucesso',
      id: data.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Submission error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});