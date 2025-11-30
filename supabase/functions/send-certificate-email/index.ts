import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  fullName: string;
  eventName: string;
  pdfUrl: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, eventName, pdfUrl, code }: EmailRequest = await req.json();

    if (!email || !fullName || !eventName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados obrigatórios faltando' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const emailResponse = await resend.emails.send({
      from: 'CIVENI 2025 <onboarding@resend.dev>',
      to: [email],
      subject: `Seu certificado do ${eventName} está disponível!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #003d82 0%, #8b1538 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #003d82 0%, #8b1538 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .code { background: #fff; border: 2px solid #003d82; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; color: #003d82; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Parabéns, ${fullName}!</h1>
              <p>Seu certificado está pronto</p>
            </div>
            <div class="content">
              <p>Olá <strong>${fullName}</strong>,</p>
              
              <p>É com grande satisfação que confirmamos sua participação no <strong>${eventName}</strong>!</p>
              
              <p>Você foi aprovado na validação de presença e seu certificado já está disponível para download.</p>
              
              <div class="code">
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Código de Verificação</div>
                ${code}
              </div>
              
              <p style="text-align: center;">
                <a href="${pdfUrl}" class="button">📄 BAIXAR CERTIFICADO EM PDF</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <h3>📌 Próximos passos:</h3>
              <ul>
                <li><strong>Adicione ao LinkedIn:</strong> Compartilhe sua conquista com sua rede profissional</li>
                <li><strong>Siga o CIVENI nas redes sociais:</strong> Fique por dentro dos próximos eventos</li>
                <li><strong>Confira nossos próximos eventos:</strong> Continue se desenvolvendo conosco</li>
              </ul>
              
              <p>Se tiver qualquer dúvida, não hesite em entrar em contato conosco.</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe CIVENI 2025</strong><br>
              Veni Creator Christian University (VCCU)</p>
            </div>
            <div class="footer">
              <p>© 2025 CIVENI - Todos os direitos reservados</p>
              <p>Este certificado pode ser verificado em: civeni.com/certificados/verify/${code}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Email enviado com sucesso:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);