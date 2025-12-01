import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Verificando se categoria 'Voluntários VCCU - GRATUITO' já existe...");

    // Verificar se a categoria já existe
    const { data: existingCategory } = await supabaseClient
      .from('event_category')
      .select('*')
      .eq('slug', 'voluntarios-vccu-gratuito')
      .single();

    let categoryResult;

    if (!existingCategory) {
      console.log("Criando categoria 'Voluntários VCCU - GRATUITO'...");
      
      // Criar a categoria para Voluntários
      const { data: newCategory, error: categoryError } = await supabaseClient
        .from('event_category')
        .insert({
          event_id: 'afc90e54-fdb6-48bc-8631-ede4ab79b21d',
          slug: 'voluntarios-vccu-gratuito',
          title_pt: 'Voluntários VCCU - GRATUITO',
          title_en: 'Volunteers VCCU - FREE',
          title_es: 'Voluntarios VCCU - GRATIS',
          title_tr: 'Gönüllüler VCCU - ÜCRETSİZ',
          description_pt: 'Categoria gratuita para voluntários do evento',
          is_free: true,
          is_active: true,
          price_cents: 0,
          order_index: 6
        })
        .select()
        .single();

      if (categoryError) throw categoryError;
      categoryResult = newCategory;
      console.log("Categoria 'Voluntários VCCU - GRATUITO' criada com sucesso:", newCategory.id);
    } else {
      categoryResult = existingCategory;
      console.log("Categoria 'Voluntários VCCU - GRATUITO' já existe:", existingCategory.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Categoria "Voluntários VCCU - GRATUITO" configurada com sucesso',
        category: categoryResult
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
