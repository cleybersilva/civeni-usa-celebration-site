import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This function uses SERVICE_ROLE_KEY for internal operations
    // No external authentication needed as it's a maintenance function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all speakers with base64 images
    const { data: speakers, error: fetchError } = await supabase
      .from('cms_speakers')
      .select('id, name, image_url')
      .like('image_url', 'data:%');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${speakers.length} speakers with base64 images`);

    const results = [];

    for (const speaker of speakers) {
      try {
        const dataUrl = speaker.image_url;
        
        // Convert data URL to blob
        const parts = dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(parts[1] || '');
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }
        
        const blob = new Blob([u8arr], { type: mime });
        const extension = mime.split('/')[1] || 'jpg';
        
        // Upload to storage
        const filePath = `speakers/${speaker.id}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('site-civeni')
          .upload(filePath, blob, { 
            upsert: true, 
            contentType: mime 
          });

        if (uploadError) {
          console.error(`Upload error for ${speaker.name}:`, uploadError);
          results.push({
            id: speaker.id,
            name: speaker.name,
            success: false,
            error: uploadError.message
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('site-civeni')
          .getPublicUrl(filePath);

        // Update speaker with new URL
        const { error: updateError } = await supabase
          .from('cms_speakers')
          .update({ 
            image_url: urlData.publicUrl,
            photo_version: (speaker.photo_version || 0) + 1 
          })
          .eq('id', speaker.id);

        if (updateError) {
          console.error(`Update error for ${speaker.name}:`, updateError);
          results.push({
            id: speaker.id,
            name: speaker.name,
            success: false,
            error: updateError.message
          });
          continue;
        }

        console.log(`Successfully migrated ${speaker.name}`);
        results.push({
          id: speaker.id,
          name: speaker.name,
          success: true,
          newUrl: urlData.publicUrl
        });

      } catch (error) {
        console.error(`Error processing ${speaker.name}:`, error);
        results.push({
          id: speaker.id,
          name: speaker.name,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Migration completed',
        total: speakers.length,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
