// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX = 50 * 1024 * 1024; // 50 MB

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function badRequest(msg: string, code = 400) {
  return new Response(JSON.stringify({ error: msg }), { 
    status: code, 
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
}

async function calculateSHA256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return badRequest("Método não permitido", 405);

    // Submissão anônima agora é permitida
    let userId: string | null = null;
    
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (jwt) {
      // Se houver token, tenta usar (para usuários autenticados)
      const sbUser = createClient(SUPABASE_URL, jwt);
      const { data: userResp } = await sbUser.auth.getUser();
      if (userResp?.user) {
        userId = userResp.user.id;
      }
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const tipo = String(form.get("tipo") ?? "");
    const titulo = String(form.get("titulo") ?? "");
    const autores = JSON.parse(String(form.get("autores") ?? "[]"));
    const resumo = String(form.get("resumo") ?? "");
    const area_tematica = String(form.get("area_tematica") ?? "");
    const palavras_chave = JSON.parse(String(form.get("palavras_chave") ?? "[]"));

    // Validações
    if (!file) return badRequest("Arquivo obrigatório");
    if (!["artigo", "consorcio"].includes(tipo)) return badRequest("Tipo inválido");
    if (!titulo.trim()) return badRequest("Título obrigatório");
    if (!Array.isArray(autores) || autores.length === 0) return badRequest("Autores obrigatórios");
    
    // Validar tipo de arquivo
    if (file.type === "application/pdf") {
      return badRequest("Formato não permitido. Envie o arquivo somente em DOCX. PDFs não são aceitos para possibilitar correções pelos avaliadores.");
    }
    if (!ALLOWED.includes(file.type)) {
      return badRequest("Tipo de arquivo inválido. Envie um DOCX.");
    }
    
    // Validar tamanho
    if (file.size > MAX) {
      return badRequest(`Arquivo muito grande. O limite é ${Math.round(MAX / 1024 / 1024)} MB para DOCX.`);
    }
    
    // Validar resumo (máximo 1500 caracteres)
    if (resumo && resumo.length > 1500) {
      return badRequest("Resumo muito longo. Use até 1500 caracteres.");
    }

    // Processar arquivo
    const buf = new Uint8Array(await file.arrayBuffer());
    
    // Validar assinatura binária do DOCX (deve ser um arquivo ZIP)
    // DOCX files start with PK signature (50 4B 03 04)
    if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4B || buf[2] !== 0x03 || buf[3] !== 0x04) {
      console.error("❌ Assinatura binária inválida. Esperado: ZIP (DOCX)");
      return badRequest("Arquivo inválido ou corrompido. Envie um DOCX válido.");
    }
    
    const sha256 = await calculateSHA256(buf);

    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = userId 
      ? `user/${userId}/${tipo}/${filename}` 
      : `anonymous/${tipo}/${filename}`;

    console.log(`📤 Fazendo upload: ${path}`);

    // Upload com service role (ignora RLS)
    const { error: upErr } = await supabaseAdmin.storage
      .from("civeni-submissoes")
      .upload(path, buf, { contentType: file.type, upsert: false });

    if (upErr) {
      console.error("❌ Erro no upload:", upErr);
      return badRequest(`Falha no upload: ${upErr.message}`, 500);
    }

    console.log("✅ Upload concluído");

    // Registrar submissão na tabela "submissions"
    const autorPrincipal = autores[0]?.nome || "Sem nome";
    const emailPrincipal = autores[0]?.email || "";
    
    const { data: ins, error: insErr } = await supabaseAdmin
      .from("submissions")
      .insert({
        tipo,
        titulo: titulo.trim(),
        resumo: resumo.trim() || null,
        area_tematica: area_tematica.trim() || null,
        palavras_chave,
        autor_principal: autorPrincipal,
        autores,
        email: emailPrincipal,
        instituicao: autores[0]?.instituicao || null,
        arquivo_path: path,
        arquivo_mime: file.type,
        arquivo_size: file.size,
        status: "recebido"
      })
      .select()
      .single();

    if (insErr) {
      console.error("❌ Erro ao registrar:", insErr);
      return badRequest(`Falha ao registrar submissão: ${insErr.message}`, 500);
    }

    console.log("✅ Submissão registrada:", ins.id);

    return new Response(JSON.stringify({ ok: true, submissao: ins }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  } catch (e: any) {
    console.error("❌ Erro inesperado:", e);
    return badRequest(`Erro inesperado: ${e?.message ?? String(e)}`, 500);
  }
});
