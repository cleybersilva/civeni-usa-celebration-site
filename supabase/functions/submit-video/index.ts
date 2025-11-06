import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VideoSubmission {
  nome: string
  email: string
  tipo_participante: string
  curso?: string
  turma?: string
  video_url: string
  observacoes?: string
}

// Normalizar YouTube URLs
function normalizeYouTubeUrl(url: string): string {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/i
  const match = url.match(youtubeRegex)
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`
  }
  return url
}

// Normalizar Vimeo URLs
function normalizeVimeoUrl(url: string): string {
  const vimeoRegex = /vimeo\.com\/(\d{6,})/i
  const match = url.match(vimeoRegex)
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}`
  }
  return url
}

// Normalizar Google Drive URLs
function normalizeGoogleDriveUrl(url: string): string {
  const driveRegex = /drive\.google\.com\/(file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i
  const match = url.match(driveRegex)
  if (match && match[2]) {
    return `https://drive.google.com/file/d/${match[2]}/preview`
  }
  return url
}

// Validar e normalizar URL do vídeo
function validateAndNormalizeUrl(url: string): { valid: boolean; normalized: string; error?: string } {
  url = url.trim()
  
  // Validar HTTPS
  if (!url.match(/^https?:\/\//i)) {
    return { valid: false, normalized: url, error: 'URL deve começar com http:// ou https://' }
  }
  
  // YouTube
  if (url.match(/youtube\.com|youtu\.be/i)) {
    const normalized = normalizeYouTubeUrl(url)
    return { valid: normalized !== url || url.includes('youtube.com'), normalized }
  }
  
  // Vimeo
  if (url.match(/vimeo\.com/i)) {
    const normalized = normalizeVimeoUrl(url)
    return { valid: normalized !== url || url.includes('vimeo.com'), normalized }
  }
  
  // Google Drive
  if (url.match(/drive\.google\.com/i)) {
    const normalized = normalizeGoogleDriveUrl(url)
    return { valid: true, normalized }
  }
  
  // OneDrive/SharePoint
  if (url.match(/1drv\.ms|sharepoint\.com/i)) {
    return { valid: true, normalized: url }
  }
  
  // Outros drives/serviços com HTTPS
  if (url.match(/^https:\/\//i)) {
    return { valid: true, normalized: url }
  }
  
  return { valid: false, normalized: url, error: 'URL não reconhecida. Envie links de YouTube, Vimeo, Google Drive, OneDrive ou outros serviços com HTTPS.' }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const body: VideoSubmission = await req.json()

    // Validações básicas
    if (!body.nome || !body.email || !body.tipo_participante || !body.video_url) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios faltando: nome, email, tipo_participante, video_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar tipo_participante
    const tiposValidos = ['Aluno(a) VCCU', 'Participante Externo', 'Convidado(a)']
    if (!tiposValidos.includes(body.tipo_participante)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de participante inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar e normalizar URL
    const urlValidation = validateAndNormalizeUrl(body.video_url)
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({ error: urlValidation.error || 'URL de vídeo inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Preparar dados para inserção
    const submissionData: any = {
      nome: body.nome.trim(),
      email: body.email.toLowerCase().trim(),
      tipo_participante: body.tipo_participante,
      video_url_original: body.video_url,
      video_url_normalized: urlValidation.normalized,
      observacoes: body.observacoes?.trim() || null,
      submitted_ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
    }

    // Incluir curso/turma somente se tipo for Aluno(a) VCCU
    if (body.tipo_participante === 'Aluno(a) VCCU') {
      submissionData.curso = body.curso?.trim() || null
      submissionData.turma = body.turma?.trim() || null
    }

    // Inserir no banco
    const { data, error } = await supabaseClient
      .from('video_submissions')
      .insert(submissionData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir submissão:', error)
      return new Response(
        JSON.stringify({ error: 'Falha ao salvar submissão' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id, 
        status: data.status 
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})