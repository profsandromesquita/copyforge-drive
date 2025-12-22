import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[backfill-thumbnails] Starting batch processing...');
    
    // Find copies with base64 images but no preview_image_url
    const { data: copies, error } = await supabase
      .from('copies')
      .select('id, sessions')
      .is('preview_image_url', null)
      .not('sessions', 'is', null)
      .limit(10);

    if (error) {
      console.error('[backfill-thumbnails] Error fetching copies:', error);
      throw error;
    }

    console.log(`[backfill-thumbnails] Found ${copies?.length || 0} copies to process`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const copy of copies || []) {
      results.processed++;
      
      try {
        const base64Image = findBase64Image(copy.sessions);
        
        if (!base64Image) {
          console.log(`[backfill-thumbnails] No base64 image found for copy ${copy.id}`);
          results.skipped++;
          continue;
        }

        const thumbnailUrl = await generateAndUploadThumbnail(
          supabase, 
          lovableApiKey, 
          base64Image, 
          copy.id
        );

        if (thumbnailUrl) {
          const { error: updateError } = await supabase
            .from('copies')
            .update({ preview_image_url: thumbnailUrl })
            .eq('id', copy.id);

          if (updateError) throw updateError;

          results.success++;
          console.log(`[backfill-thumbnails] Success for copy ${copy.id}: ${thumbnailUrl}`);
        } else {
          results.skipped++;
        }
      } catch (err: unknown) {
        results.failed++;
        const errMessage = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Copy ${copy.id}: ${errMessage}`);
        console.error(`[backfill-thumbnails] Failed for copy ${copy.id}:`, err);
      }
    }

    console.log('[backfill-thumbnails] Batch complete:', results);
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[backfill-thumbnails] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function findBase64Image(sessions: unknown[]): string | null {
  if (!sessions || !Array.isArray(sessions)) return null;

  for (const session of sessions) {
    const sess = session as { blocks?: unknown[] };
    if (!sess?.blocks || !Array.isArray(sess.blocks)) continue;

    for (const block of sess.blocks) {
      const b = block as { type?: string; config?: { imageUrl?: string }; imageUrl?: string };
      if (b?.type === 'image') {
        const imageUrl = b?.config?.imageUrl || b?.imageUrl;
        if (imageUrl && imageUrl.startsWith('data:image/')) {
          return imageUrl;
        }
      }
    }
  }

  return null;
}

async function generateAndUploadThumbnail(
  supabase: any,
  lovableApiKey: string,
  base64Image: string,
  copyId: string
): Promise<string | null> {
  console.log(`[backfill-thumbnails] Generating thumbnail for copy ${copyId}...`);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Create a 300x300 pixel thumbnail version of this image. Keep the main subject centered and visible. Output only the resized image, no changes to content."
              },
              {
                type: "image_url",
                image_url: { url: base64Image }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[backfill-thumbnails] AI API error: ${response.status} - ${errorText}`);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[backfill-thumbnails] AI response received');

    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl || !generatedImageUrl.startsWith('data:image/')) {
      console.log('[backfill-thumbnails] No image in AI response, uploading original');
      return await uploadThumbnailToStorage(supabase, base64Image, copyId);
    }

    return await uploadThumbnailToStorage(supabase, generatedImageUrl, copyId);

  } catch (error) {
    console.error('[backfill-thumbnails] Error generating thumbnail:', error);
    try {
      return await uploadThumbnailToStorage(supabase, base64Image, copyId);
    } catch {
      return null;
    }
  }
}

async function uploadThumbnailToStorage(
  supabase: any,
  base64Data: string,
  copyId: string
): Promise<string | null> {
  try {
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error('[backfill-thumbnails] Invalid base64 format');
      return null;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    
    let extension = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      extension = 'jpg';
    } else if (mimeType.includes('webp')) {
      extension = 'webp';
    }

    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `thumbnails/${copyId}/${timestamp}-${random}.${extension}`;

    console.log(`[backfill-thumbnails] Uploading to: ${fileName}`);

    const { error } = await supabase.storage
      .from('copy-images')
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[backfill-thumbnails] Upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('copy-images')
      .getPublicUrl(fileName);

    console.log(`[backfill-thumbnails] Upload complete: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error('[backfill-thumbnails] Error uploading thumbnail:', error);
    return null;
  }
}
