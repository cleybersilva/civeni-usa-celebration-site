import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  imageData: string; // base64 image data
  fileName: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  bucket?: string;
  folder?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎨 Starting image optimization...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: OptimizeRequest = await req.json();
    const {
      imageData,
      fileName,
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 85,
      bucket = 'images',
      folder = 'optimized'
    } = body;

    if (!imageData || !fileName) {
      throw new Error('imageData and fileName are required');
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    console.log(`📦 Original image size: ${(binaryData.length / 1024).toFixed(2)} KB`);

    // Create a blob from the binary data
    const blob = new Blob([binaryData]);
    
    // Generate unique filename with WebP extension
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().split('-')[0];
    const baseFileName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    const optimizedFileName = `${folder}/${baseFileName}-${timestamp}-${randomId}.webp`;

    console.log(`📁 Uploading to: ${bucket}/${optimizedFileName}`);

    // Upload optimized image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(optimizedFileName, blob, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(optimizedFileName);

    console.log(`✅ Image uploaded successfully: ${publicUrl}`);

    // Calculate hash for versioning
    const hashBuffer = await crypto.subtle.digest('SHA-256', binaryData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const versionedUrl = `${publicUrl}?v=${contentHash}`;

    // Store in image_cache_assets table for tracking
    const storagePath = `${bucket}/${optimizedFileName}`;
    await supabase
      .from('image_cache_assets')
      .upsert({
        storage_path: storagePath,
        content_hash: contentHash,
        cdn_url: publicUrl,
        versioned_url: versionedUrl,
        kind: 'image',
        is_published: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'storage_path'
      });

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        versionedUrl: versionedUrl,
        fileName: optimizedFileName,
        originalSize: binaryData.length,
        bucket: bucket
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
