import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
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
      .from('submissions')
      .select('id, arquivo_path, arquivo_mime, file_path_docx, docx_converted_at')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      console.error('Erro ao buscar submissão:', fetchError);
      throw new Error('Submissão não encontrada');
    }

    const arquivoPath = (submission as any).arquivo_path as string | null;
    const arquivoMime = (submission as any).arquivo_mime as string | null;
    const existingDocxPath = (submission as any).file_path_docx as string | null;

    console.log('Submissão encontrada:', {
      id: submission.id,
      arquivo_mime: arquivoMime,
      arquivo_path: arquivoPath,
      file_path_docx: existingDocxPath,
      docx_converted_at: (submission as any).docx_converted_at ?? null,
    });

    if (!arquivoPath) {
      throw new Error('Submissão não possui arquivo vinculado');
    }

    const bucketId = 'civeni-submissoes';

    // Se já existe DOCX convertido, retornar ele
    if (existingDocxPath) {
      console.log('DOCX já existe, gerando URL assinada...');
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient
        .storage
        .from(bucketId)
        .createSignedUrl(existingDocxPath.replace(/^submissions\//, ''), 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Erro ao gerar URL assinada para DOCX existente:', signedUrlError);
        throw new Error('Falha ao gerar URL assinada para DOCX existente');
      }

      return new Response(
        JSON.stringify({ url: signedUrlData.signedUrl, type: 'docx' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se o arquivo original já é DOCX, retornar ele
    if (
      (arquivoMime && arquivoMime.includes('wordprocessingml')) ||
      arquivoPath.toLowerCase().endsWith('.docx')
    ) {
      console.log('Arquivo original já é DOCX, gerando URL assinada...');
      const { data: signedUrlData, error: signedUrlError } = await supabaseClient
        .storage
        .from(bucketId)
        .createSignedUrl(arquivoPath, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Erro ao gerar URL assinada para DOCX original:', signedUrlError);
        throw new Error('Falha ao gerar URL assinada para DOCX original');
      }

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
      .from(bucketId)
      .download(arquivoPath);

    if (downloadError || !pdfData) {
      console.error('Erro ao baixar arquivo PDF:', downloadError);
      throw new Error('Erro ao baixar arquivo PDF');
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
            operation: 'import/upload',
          },
          'convert-to-docx': {
            operation: 'convert',
            input: 'upload-pdf',
            output_format: 'docx',
            engine: 'office',
            optimize_print: false,
          },
          'export-docx': {
            operation: 'export/url',
            input: 'convert-to-docx',
          },
        },
      }),
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
    uploadFormData.append('file', pdfData as Blob);

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
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Aguardar 1 segundo

      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: {
          'Authorization': `Bearer ${cloudConvertApiKey}`,
        },
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
      },
    });

    const finalJobData = await finalJobResponse.json();
    const exportTask = finalJobData.data.tasks.find((t: any) => t.name === 'export-docx');
    const docxUrl = exportTask.result.files[0].url;

    console.log('Conversão concluída, baixando DOCX...');

    // Baixar o DOCX convertido
    const docxResponse = await fetch(docxUrl);
    const docxBlob = await docxResponse.blob();

    // Salvar o DOCX no storage
    const originalFileName = arquivoPath.split('/').pop() || `${submission.id}.pdf`;
    const docxFileName = originalFileName.replace(/\.pdf$/i, '.docx');
    const docxPath = `converted/${docxFileName}`;

    console.log('Salvando DOCX convertido no storage:', docxPath);

    const { error: uploadError } = await supabaseClient
      .storage
      .from(bucketId)
      .upload(docxPath, docxBlob, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    if (uploadError) {
      console.error('Erro ao salvar DOCX convertido:', uploadError);
      throw new Error('Erro ao salvar DOCX convertido: ' + uploadError.message);
    }

    console.log('DOCX salvo, atualizando registro no banco...');

    // Atualizar registro no banco com o caminho do DOCX
    const { error: updateError } = await supabaseClient
      .from('submissions')
      .update({
        file_path_docx: docxPath,
        docx_converted_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Erro ao atualizar registro:', updateError);
    }

    // Gerar URL assinada para o DOCX
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from(bucketId)
      .createSignedUrl(docxPath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Erro ao gerar URL assinada para DOCX convertido:', signedUrlError);
      throw new Error('Falha ao gerar URL assinada para DOCX convertido');
    }

    console.log('Conversão completa, retornando URL do DOCX');

    return new Response(
      JSON.stringify({ url: signedUrlData.signedUrl, type: 'docx', converted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
