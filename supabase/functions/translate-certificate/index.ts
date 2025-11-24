import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  texts: {
    header_title?: string;
    header_subtitle?: string;
    body_certifyLabel?: string;
    body_mainText?: string;
    footer_locationDateText?: string;
    badge_text?: string;
    signature_1_label?: string;
    signature_1_name?: string;
    signature_2_label?: string;
    signature_2_name?: string;
    [key: string]: string | undefined;
  };
  targetLanguage: 'pt-BR' | 'en-US' | 'es-ES';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLanguage }: TranslateRequest = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Mapear idiomas para nomes completos
    const languageNames = {
      'pt-BR': 'Português do Brasil',
      'en-US': 'English (United States)',
      'es-ES': 'Español (España)'
    };

    const targetLangName = languageNames[targetLanguage];

    // Criar prompt com instruções detalhadas
    const textsToTranslate = Object.entries(texts)
      .filter(([_, value]) => value && value.trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const systemPrompt = `Você é um tradutor profissional especializado em certificados acadêmicos. 
Traduza TODOS os textos fornecidos para ${targetLangName}, mantendo:
1. Todos os placeholders exatamente como estão: {{nome_participante}}, {{tipo_participacao}}, {{nome_evento}}, {{data_evento}}, {{carga_horaria}}, {{data_emissao}}, {{nome_reitor}}, {{nome_coordenador}}
2. A formatação e estrutura originais
3. Tom formal e acadêmico apropriado para certificados

Retorne APENAS um objeto JSON com as mesmas chaves e os valores traduzidos. Não adicione explicações ou comentários.`;

    const userPrompt = `Traduza os seguintes textos de certificado para ${targetLangName}:\n\n${textsToTranslate}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Limite de taxa excedido. Tente novamente em alguns instantes." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Créditos insuficientes. Adicione créditos em Settings -> Workspace -> Usage." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao comunicar com serviço de tradução");
    }

    const aiResponse = await response.json();
    const translatedText = aiResponse.choices?.[0]?.message?.content;

    if (!translatedText) {
      throw new Error("Resposta inválida do serviço de tradução");
    }

    // Tentar parsear o JSON da resposta
    let translatedTexts;
    try {
      // Remover markdown code blocks se presentes
      const cleanedText = translatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      translatedTexts = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Erro ao parsear resposta da IA:", translatedText);
      throw new Error("Erro ao processar tradução");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        translatedTexts,
        targetLanguage 
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in translate-certificate function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        } 
      }
    );
  }
};

serve(handler);
