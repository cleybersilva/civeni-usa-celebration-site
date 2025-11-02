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

    console.log("Verificando se 'Sorteados' já existe...");

    // Verificar se o tipo já existe
    const { data: existingType } = await supabaseClient
      .from('participant_types')
      .select('*')
      .eq('type_name', 'Sorteados')
      .single();

    let participantTypeResult;

    if (!existingType) {
      console.log("Criando tipo 'Sorteados'...");
      // Criar o tipo "Sorteados"
      const { data: newType, error: typeError } = await supabaseClient
        .from('participant_types')
        .insert({
          type_name: 'Sorteados',
          description: 'Participantes sorteados com 100% de desconto',
          requires_course_selection: false,
          is_active: true
        })
        .select()
        .single();

      if (typeError) throw typeError;
      participantTypeResult = newType;
      console.log("Tipo 'Sorteados' criado com sucesso:", newType.id);
    } else {
      participantTypeResult = existingType;
      console.log("Tipo 'Sorteados' já existe:", existingType.id);
    }

    // Atualizar o cupom CIVENI2025FREE
    console.log("Atualizando cupom CIVENI2025FREE...");
    const { data: coupon, error: couponError } = await supabaseClient
      .from('coupon_codes')
      .update({
        participant_type: 'Professor(a),Palestrantes,Sorteados',
        description: 'Cupom de 100% de desconto para Professor(a), Palestrantes e Sorteados',
        updated_at: new Date().toISOString()
      })
      .eq('code', 'CIVENI2025FREE')
      .select()
      .single();

    if (couponError) throw couponError;

    console.log("Cupom atualizado com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tipo "Sorteados" configurado com sucesso',
        participantType: participantTypeResult,
        coupon: coupon
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
