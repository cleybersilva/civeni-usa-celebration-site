import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submission_id } = await req.json();

    if (!submission_id) {
      return new Response(
        JSON.stringify({ error: 'submission_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados da submissão
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (fetchError || !submission) {
      console.error('Erro ao buscar submissão:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Submissão não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tipoLabel = submission.tipo === 'artigo' ? 'Artigo' : 'Consórcio';

    // Enviar Email
    try {
      await resend.emails.send({
        from: 'CIVENI 2025 <noreply@civeni.com>',
        to: [submission.email],
        subject: `CIVENI 2025 – ${tipoLabel} validado com sucesso`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #333; margin-bottom: 20px;">🎉 Submissão Validada!</h1>
              
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Olá, <strong>${submission.autor_principal}</strong>!
              </p>

              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Temos o prazer de informar que seu <strong>${tipoLabel}</strong> foi <strong>validado com sucesso</strong> pela organização do III CIVENI 2025.
              </p>

              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Detalhes da Submissão</h3>
                <p style="margin: 10px 0;"><strong>Tipo:</strong> ${tipoLabel}</p>
                <p style="margin: 10px 0;"><strong>Título:</strong> ${submission.titulo}</p>
                ${submission.area_tematica ? `<p style="margin: 10px 0;"><strong>Área Temática:</strong> ${submission.area_tematica}</p>` : ''}
                ${submission.instituicao ? `<p style="margin: 10px 0;"><strong>Instituição:</strong> ${submission.instituicao}</p>` : ''}
              </div>

              <h3 style="color: #333; margin-top: 30px;">Próximos Passos</h3>
              <p style="color: #555; font-size: 16px; line-height: 1.6;">
                Sua submissão está agora em processo de avaliação. Em breve, enviaremos mais informações sobre:
              </p>
              <ul style="color: #555; font-size: 16px; line-height: 1.8;">
                <li>Cronograma de apresentações</li>
                <li>Orientações para preparação</li>
                <li>Informações sobre o evento</li>
              </ul>

              <p style="color: #555; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                Fique atento ao seu email e WhatsApp cadastrado para receber atualizações.
              </p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="color: #999; font-size: 14px; text-align: center;">
                <strong>III CIVENI 2025</strong><br>
                Celebration, Florida - EUA<br>
                contato@civeni.com
              </p>
            </div>
          </div>
        `,
      });

      console.log('Email enviado com sucesso para:', submission.email);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    // Enviar WhatsApp (se disponível)
    if (submission.whatsapp) {
      try {
        const whatsappUrl = Deno.env.get('WHATSAPP_API_URL');
        const whatsappToken = Deno.env.get('WHATSAPP_TOKEN');

        if (whatsappUrl && whatsappToken) {
          const message = `🎉 *CIVENI 2025*\n\nOlá, ${submission.autor_principal}!\n\nSeu ${tipoLabel} "${submission.titulo}" foi *validado com sucesso* pela organização do III CIVENI 2025.\n\nEm breve enviaremos mais informações sobre o cronograma e apresentações.\n\nFique atento aos nossos contatos!`;

          const response = await fetch(whatsappUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: submission.whatsapp.replace(/\D/g, ''),
              type: 'text',
              text: { body: message }
            })
          });

          if (response.ok) {
            console.log('WhatsApp enviado com sucesso para:', submission.whatsapp);
          } else {
            console.error('Erro ao enviar WhatsApp:', await response.text());
          }
        }
      } catch (whatsappError) {
        console.error('Erro ao enviar WhatsApp:', whatsappError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notificações enviadas' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
