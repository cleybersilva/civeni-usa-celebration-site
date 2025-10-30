import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId ausente" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados da submissão
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("arquivo_path, arquivo_mime, arquivo_size")
      .eq("id", submissionId)
      .single();

    if (subError || !submission) {
      console.error("Erro ao buscar submissão:", subError);
      return new Response(
        JSON.stringify({ error: "Submissão não encontrada" }), 
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filePath = submission.arquivo_path;
    if (!filePath) {
      return new Response(
        JSON.stringify({ error: "Arquivo não vinculado à submissão" }), 
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair nome do arquivo do path
    const filename = filePath.split('/').pop() || 'arquivo';

    // Gerar URL assinada com 5 minutos de validade
    const { data: signedData, error: signError } = await supabase.storage
      .from("civeni-submissoes")
      .createSignedUrl(filePath, 300, {
        download: filename,
      });

    if (signError || !signedData?.signedUrl) {
      console.error("Erro ao gerar URL assinada:", signError);
      return new Response(
        JSON.stringify({ error: "Falha ao assinar URL" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        url: signedData.signedUrl,
        filename: filename,
        mime: submission.arquivo_mime || "application/octet-stream",
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Erro interno:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", detail: String(error) }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
