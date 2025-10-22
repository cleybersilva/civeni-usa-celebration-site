// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX = 15 * 1024 * 1024; // 15 MB

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

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return badRequest("Não autenticado", 401);

    // Verificar usuário autenticado
    const sbUser = createClient(SUPABASE_URL, jwt);
    const { data: userResp, error: userErr } = await sbUser.auth.getUser();
    if (userErr || !userResp?.user) return badRequest("Token inválido", 401);

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
    if (!ALLOWED.includes(file.type)) return badRequest("MIME não permitido. Use PDF ou DOCX");
    if (file.size > MAX) return badRequest(`Arquivo excede o limite de ${Math.round(MAX / 1024 / 1024)} MB`);

    // Processar arquivo
    const buf = new Uint8Array(await file.arrayBuffer());
    const sha256 = await calculateSHA256(buf);

    const uid = userResp.user.id;
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = `user/${uid}/${tipo}/${filename}`;

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

    // Registrar submissão
    const { data: ins, error: insErr } = await supabaseAdmin
      .from("civeni_submissoes")
      .insert({
        tipo,
        titulo: titulo.trim(),
        autores,
        resumo: resumo.trim() || null,
        area_tematica: area_tematica.trim() || null,
        palavras_chave,
        file_path: path,
        file_sha256: sha256,
        mime_type: file.type,
        file_size_bytes: file.size,
        created_by: uid,
        status: "enviado"
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
