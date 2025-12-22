import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { copyId, batchMode } = await req.json();

    console.log(`[generate-thumbnail] Starting for copyId: ${copyId}, batchMode: ${batchMode}`);

    // If batch mode, process multiple copies
    if (batchMode) {
      const result = await processBatch(supabase, lovableApiKey);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single copy mode
    if (!copyId) {
      return new Response(JSON.stringify({ error: 'copyId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await processSingleCopy(supabase, lovableApiKey, copyId);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-thumbnail] Error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processBatch(supabase: any, lovableApiKey: string) {
  console.log('[generate-thumbnail] Starting batch processing...');
  
  // Find copies with base64 images but no preview_image_url
  const { data: copies, error } = await supabase
    .from('copies')
    .select('id, sessions')
    .is('preview_image_url', null)
    .not('sessions', 'is', null)
    .limit(10); // Process 10 at a time

  if (error) {
    console.error('[generate-thumbnail] Error fetching copies:', error);
    throw error;
  }

  console.log(`[generate-thumbnail] Found ${copies?.length || 0} copies to process`);

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
      // Find first base64 image in sessions
      const base64Image = findBase64Image(copy.sessions);
      
      if (!base64Image) {
        console.log(`[generate-thumbnail] No base64 image found for copy ${copy.id}`);
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
        // Update copy with thumbnail URL
        const { error: updateError } = await supabase
          .from('copies')
          .update({ preview_image_url: thumbnailUrl })
          .eq('id', copy.id);

        if (updateError) {
          throw updateError;
        }

        results.success++;
        console.log(`[generate-thumbnail] Success for copy ${copy.id}: ${thumbnailUrl}`);
      } else {
        results.skipped++;
      }
    } catch (err: unknown) {
      results.failed++;
      const errMessage = err instanceof Error ? err.message : 'Unknown error';
      results.errors.push(`Copy ${copy.id}: ${errMessage}`);
      console.error(`[generate-thumbnail] Failed for copy ${copy.id}:`, err);
    }
  }

  console.log('[generate-thumbnail] Batch complete:', results);
  return results;
}

async function processSingleCopy(supabase: any, lovableApiKey: string, copyId: string) {
  console.log(`[generate-thumbnail] Processing single copy: ${copyId}`);

  const { data: copy, error } = await supabase
    .from('copies')
    .select('id, sessions')
    .eq('id', copyId)
    .single();

  if (error) {
    console.error('[generate-thumbnail] Error fetching copy:', error);
    throw error;
  }

  const base64Image = findBase64Image(copy.sessions);

  if (!base64Image) {
    console.log(`[generate-thumbnail] No base64 image found for copy ${copyId}`);
    return { success: false, reason: 'no_base64_image' };
  }

  const thumbnailUrl = await generateAndUploadThumbnail(
    supabase, 
    lovableApiKey, 
    base64Image, 
    copyId
  );

  if (thumbnailUrl) {
    const { error: updateError } = await supabase
      .from('copies')
      .update({ preview_image_url: thumbnailUrl })
      .eq('id', copyId);

    if (updateError) {
      throw updateError;
    }

    console.log(`[generate-thumbnail] Updated copy ${copyId} with thumbnail: ${thumbnailUrl}`);
    return { success: true, thumbnailUrl };
  }

  return { success: false, reason: 'thumbnail_generation_failed' };
}

function findBase64Image(sessions: any[]): string | null {
  if (!sessions || !Array.isArray(sessions)) return null;

  for (const session of sessions) {
    if (!session?.blocks || !Array.isArray(session.blocks)) continue;

    for (const block of session.blocks) {
      if (block?.type === 'image') {
        const imageUrl = block?.config?.imageUrl || block?.imageUrl;
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
  console.log(`[generate-thumbnail] Generating thumbnail for copy ${copyId}...`);

  try {
    // Use Gemini Flash Image model to create a compressed thumbnail
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
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-thumbnail] AI API error: ${response.status} - ${errorText}`);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-thumbnail] AI response received');

    // Extract generated image
    const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl || !generatedImageUrl.startsWith('data:image/')) {
      console.log('[generate-thumbnail] No image in AI response, using original resized');
      // Fallback: just upload a portion of original as thumbnail
      // This shouldn't happen often, but provides a safety net
      return await uploadThumbnailToStorage(supabase, base64Image, copyId);
    }

    // Upload thumbnail to storage
    return await uploadThumbnailToStorage(supabase, generatedImageUrl, copyId);

  } catch (error) {
    console.error('[generate-thumbnail] Error generating thumbnail:', error);
    // Fallback: try to upload original (will be large but at least works)
    try {
      return await uploadThumbnailToStorage(supabase, base64Image, copyId);
    } catch (fallbackError) {
      console.error('[generate-thumbnail] Fallback upload also failed:', fallbackError);
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
    // Extract base64 content and mime type
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.error('[generate-thumbnail] Invalid base64 format');
      return null;
    }

    const mimeType = matches[1];
    const base64Content = matches[2];
    
    // Determine extension
    let extension = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      extension = 'jpg';
    } else if (mimeType.includes('webp')) {
      extension = 'webp';
    }

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `thumbnails/${copyId}/${timestamp}-${random}.${extension}`;

    console.log(`[generate-thumbnail] Uploading to: ${fileName}`);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('copy-images')
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[generate-thumbnail] Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('copy-images')
      .getPublicUrl(fileName);

    console.log(`[generate-thumbnail] Upload complete: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error('[generate-thumbnail] Error uploading thumbnail:', error);
    return null;
  }
}
