import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Persistent database-backed rate limiting
async function checkRateLimit(supabase: any, ip: string, email: string, endpoint: string): Promise<{ allowed: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_ip_address: `${ip}:${email}`,
      p_endpoint: endpoint,
      p_max_requests: 3,
      p_window_minutes: 5,
      p_block_minutes: 60
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true }; // Fail open
    }

    if (!data.allowed) {
      return { allowed: false, error: 'Too many submission attempts. Please try again later.' };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check exception:', error);
    return { allowed: true };
  }
}

function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['\";]/g, '') // Remove quotes and semicolons
    .substring(0, 5000); // Limit length
}

function validateSubmission(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.author_name?.trim()) errors.push('Nome do autor é obrigatório');
  if (!data.institution?.trim()) errors.push('Instituição é obrigatória');
  if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email válido é obrigatório');
  }
  if (!data.work_title?.trim()) errors.push('Título do trabalho é obrigatório');
  if (!data.abstract?.trim()) errors.push('Resumo é obrigatório');
  if (!data.keywords?.trim()) errors.push('Palavras-chave são obrigatórias');
  if (!data.thematic_area?.trim()) errors.push('Área temática é obrigatória');
  if (!data.submission_kind || !['artigo', 'consorcio'].includes(data.submission_kind)) {
    errors.push('Tipo de submissão inválido');
  }
  if (!data.file_url?.trim()) errors.push('Arquivo é obrigatório');
  
  return { isValid: errors.length === 0, errors };
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
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
  
  try {
    // Check if body exists and is not empty
    const text = await req.text();
    if (!text || text.trim() === '') {
      console.error('[SUBMIT-WORK] Empty request body');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Dados da requisição estão vazios' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('[SUBMIT-WORK] Invalid JSON:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Formato de dados inválido' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { email } = body;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check rate limit with database-backed system
    const rateLimitCheck = await checkRateLimit(supabase, clientIP, email || 'no-email', 'submit-work');
    if (!rateLimitCheck.allowed) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: rateLimitCheck.error 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429,
      });
    }

    // Validate submission data
    const validation = validateSubmission(body);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Dados inválidos: ${validation.errors.join(', ')}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

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
      file_url: body.file_url || null,
      file_name: body.file_name || null,
      file_size: body.file_size || null,
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

    // Send notification email - don't fail submission if email fails
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      
      if (!resendApiKey) {
        console.warn('[SUBMIT-WORK] RESEND_API_KEY not configured - skipping email');
      } else {
        const submissionType = sanitizedData.submission_kind === 'artigo' ? 'Artigo' : 'Consórcio';
        
        const emailResult = await resend.emails.send({
          from: "CIVENI <onboarding@resend.dev>",
          to: ["contact@civeni.com"],
          subject: `Nova Submissão de ${submissionType} - ${sanitizedData.work_title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Nova Submissão Recebida</h2>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin-top: 0;">Tipo de Submissão</h3>
                <p style="font-size: 16px; color: #1f2937;"><strong>${submissionType}</strong></p>
              </div>

              <div style="background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #374151;">Dados do Autor</h3>
                <p><strong>Nome:</strong> ${sanitizedData.author_name}</p>
                <p><strong>Instituição:</strong> ${sanitizedData.institution}</p>
                <p><strong>E-mail:</strong> ${sanitizedData.email}</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                
                <h3 style="color: #374151;">Dados do Trabalho</h3>
                <p><strong>Título:</strong> ${sanitizedData.work_title}</p>
                <p><strong>Área Temática:</strong> ${sanitizedData.thematic_area}</p>
                
                <h4 style="color: #374151;">Resumo</h4>
                <p style="white-space: pre-wrap;">${sanitizedData.abstract}</p>
                
                <h4 style="color: #374151;">Palavras-chave</h4>
                <p>${sanitizedData.keywords}</p>
              </div>

              <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 8px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>ID da Submissão:</strong> ${data.id}
                </p>
                <p style="margin: 10px 0 0 0; color: #1e40af;">
                  Acesse o painel administrativo para revisar e gerenciar esta submissão.
                </p>
              </div>
            </div>
          `,
        });
        
        console.log(`[SUBMIT-WORK] Email sent successfully:`, emailResult);
      }
    } catch (emailError) {
      console.error('[SUBMIT-WORK] Error sending notification email:', emailError);
      // Continue - don't fail the submission if email fails
    }

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