import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Processar eventos de storage
    for (const record of body.records || []) {
      const { name: objectPath, bucketId } = record;
      const fullPath = `${bucketId}/${objectPath}`;
      
      console.log(`Processing file: ${fullPath}`);

      try {
        // 1. Baixar o arquivo
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucketId)
          .download(objectPath);

        if (downloadError) {
          console.error('Error downloading file:', downloadError);
          continue;
        }

        // 2. Calcular hash SHA-256
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const hashBuffer = await crypto.subtle.digest('SHA-256', uint8Array);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 3. Gerar URLs
        const cdnUrl = `${supabaseUrl}/storage/v1/object/public/${bucketId}/${objectPath}`;
        const versionedUrl = `${cdnUrl}?v=${contentHash}&t=${Date.now()}`;

        // 4. Detectar tipo de asset
        const kind = detectAssetKind(objectPath);

        // 5. Obter metadados da imagem (se possível)
        let width, height, mime;
        try {
          // Para imagens, podemos extrair dimensões
          if (fileData.type.startsWith('image/')) {
            mime = fileData.type;
            // Dimensões serão calculadas no frontend se necessário
          }
        } catch (e) {
          console.warn('Could not extract image metadata:', e);
        }

        // 6. Upsert na tabela media_assets
        const { data: assetData, error: upsertError } = await supabase
          .from('image_cache_assets')
          .upsert({
            storage_path: fullPath,
            content_hash: contentHash,
            cdn_url: cdnUrl,
            versioned_url: versionedUrl,
            kind: kind,
            is_published: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'storage_path'
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Error upserting media asset:', upsertError);
          continue;
        }

        console.log(`Successfully processed: ${fullPath} -> ${contentHash}`);

        // 7. Purge CDN e revalidate (implementar conforme CDN usado)
        await purgeCDNUrls([cdnUrl, versionedUrl]);
        await revalidateRoutes(["/", "/palestrantes", "/programacao"]);

      } catch (error) {
        console.error(`Error processing file ${fullPath}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: body.records?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in image-postprocess function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function detectAssetKind(path: string): string {
  if (path.includes('banner') || path.includes('slide')) return 'banner';
  if (path.includes('speaker') || path.includes('palestrante')) return 'speaker';
  if (path.includes('logo')) return 'logo';
  return 'generic';
}

async function purgeCDNUrls(urls: string[]): Promise<void> {
  // Implementar purge específico do CDN (Cloudflare, Vercel, etc.)
  const cdnProvider = Deno.env.get('CDN_PROVIDER');
  
  if (cdnProvider === 'cloudflare') {
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    
    if (zoneId && apiToken) {
      try {
        await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: urls }),
        });
        console.log('CDN purge successful for:', urls);
      } catch (error) {
        console.error('CDN purge failed:', error);
      }
    }
  }
}

async function revalidateRoutes(routes: string[]): Promise<void> {
  const revalidateEndpoint = Deno.env.get('REVALIDATE_ENDPOINT');
  const revalidateSecret = Deno.env.get('REVALIDATE_SECRET');
  
  if (revalidateEndpoint) {
    for (const route of routes) {
      try {
        const url = `${revalidateEndpoint}?path=${encodeURIComponent(route)}`;
        const headers: Record<string, string> = {};
        
        if (revalidateSecret) {
          headers['Authorization'] = `Bearer ${revalidateSecret}`;
        }
        
        await fetch(url, { method: 'POST', headers });
        console.log(`Revalidated route: ${route}`);
      } catch (error) {
        console.error(`Failed to revalidate ${route}:`, error);
      }
    }
  }
}