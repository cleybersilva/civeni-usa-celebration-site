import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { submissionId } = await req.json();

    if (!submissionId) {
      throw new Error('ID da submissão é obrigatório');
    }

    console.log('Buscando submissão:', submissionId);

    // Buscar dados da submissão
    const { data: submission, error: fetchError } = await supabaseClient
      .from('civeni_submissoes')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      throw new Error('Submissão não encontrada');
    }

    console.log('Submissão encontrada:', {
      id: submission.id,
      mime_type: submission.mime_type,
      file_path: submission.file_path,
      file_path_docx: submission.file_path_docx
    });

    // Se já existe DOCX convertido, retornar ele
    if (submission.file_path_docx) {
      console.log('DOCX já existe, gerando URL assinada...');
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient
        .storage
        .from('submissions')
        .createSignedUrl(submission.file_path_docx.replace('submissions/', ''), 3600);

      if (signedUrlError) throw signedUrlError;

      return new Response(
        JSON.stringify({ url: signedUrlData.signedUrl, type: 'docx' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se o arquivo original já é DOCX, retornar ele
    if (submission.mime_type?.includes('wordprocessingml') || submission.file_path?.endsWith('.docx')) {
      console.log('Arquivo original já é DOCX, gerando URL assinada...');
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient
        .storage
        .from('submissions')
        .createSignedUrl(submission.file_path.replace('submissions/', ''), 3600);

      if (signedUrlError) throw signedUrlError;

      return new Response(
        JSON.stringify({ url: signedUrlData.signedUrl, type: 'docx' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se chegou aqui, é PDF e precisa converter
    console.log('Arquivo é PDF, iniciando conversão...');

    // Baixar o PDF do storage
    const { data: pdfData, error: downloadError } = await supabaseClient
      .storage
      .from('submissions')
      .download(submission.file_path.replace('submissions/', ''));

    if (downloadError || !pdfData) {
      throw new Error('Erro ao baixar arquivo PDF: ' + downloadError?.message);
    }

    console.log('PDF baixado, convertendo com CloudConvert...');

    // Converter usando CloudConvert API
    const cloudConvertApiKey = Deno.env.get('CLOUDCONVERT_API_KEY');
    if (!cloudConvertApiKey) {
      throw new Error('CloudConvert API Key não configurada');
    }

    // Criar job de conversão
    const createJobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'upload-pdf': {
            operation: 'import/upload'
          },
          'convert-to-docx': {
            operation: 'convert',
            input: 'upload-pdf',
            output_format: 'docx',
            engine: 'office',
            optimize_print: false
          },
          'export-docx': {
            operation: 'export/url',
            input: 'convert-to-docx'
          }
        }
      })
    });

    if (!createJobResponse.ok) {
      const errorText = await createJobResponse.text();
      throw new Error('Erro ao criar job de conversão: ' + errorText);
    }

    const jobData = await createJobResponse.json();
    console.log('Job de conversão criado:', jobData.data.id);

    // Upload do PDF
    const uploadTask = jobData.data.tasks.find((t: any) => t.name === 'upload-pdf');
    const uploadFormData = new FormData();
    uploadFormData.append('file', pdfData);

    const uploadResponse = await fetch(uploadTask.result.form.url, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Erro ao fazer upload do PDF para conversão');
    }

    console.log('PDF enviado para conversão, aguardando conclusão...');

    // Aguardar conclusão do job (polling)
    let jobStatus = 'processing';
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos de timeout

    while (jobStatus === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      
      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
        }
      });

      const statusData = await statusResponse.json();
      jobStatus = statusData.data.status;
      attempts++;
      
      console.log(`Status da conversão (tentativa ${attempts}):`, jobStatus);
    }

    if (jobStatus !== 'finished') {
      throw new Error('Timeout na conversão do documento');
    }

    // Obter URL do DOCX convertido
    const finalJobResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
      headers: {
        'Authorization': `Bearer ${cloudConvertApiKey}`,
      }
    });

    const finalJobData = await finalJobResponse.json();
    const exportTask = finalJobData.data.tasks.find((t: any) => t.name === 'export-docx');
    const docxUrl = exportTask.result.files[0].url;

    console.log('Conversão concluída, baixando DOCX...');

    // Baixar o DOCX convertido
    const docxResponse = await fetch(docxUrl);
    const docxBlob = await docxResponse.blob();

    // Salvar o DOCX no storage
    const docxFileName = submission.file_path.replace('.pdf', '.docx').replace('submissions/', '');
    const docxPath = `converted/${docxFileName}`;

    console.log('Salvando DOCX convertido no storage:', docxPath);

    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('submissions')
      .upload(docxPath, docxBlob, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      });

    if (uploadError) {
      throw new Error('Erro ao salvar DOCX convertido: ' + uploadError.message);
    }

    console.log('DOCX salvo, atualizando registro no banco...');

    // Atualizar registro no banco com o caminho do DOCX
    const { error: updateError } = await supabaseClient
      .from('civeni_submissoes')
      .update({
        file_path_docx: `submissions/${docxPath}`,
        docx_converted_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Erro ao atualizar registro:', updateError);
    }

    // Gerar URL assinada para o DOCX
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from('submissions')
      .createSignedUrl(docxPath, 3600);

    if (signedUrlError) throw signedUrlError;

    console.log('Conversão completa, retornando URL do DOCX');

    return new Response(
      JSON.stringify({ url: signedUrlData.signedUrl, type: 'docx', converted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
