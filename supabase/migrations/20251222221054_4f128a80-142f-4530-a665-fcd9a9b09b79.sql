-- Fix trigger to ignore base64 images when extracting preview_image_url
CREATE OR REPLACE FUNCTION public.extract_copy_previews()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  first_session JSONB;
  first_block JSONB;
BEGIN
  -- Extrair primeira sessão
  first_session := NEW.sessions->0;
  
  IF first_session IS NOT NULL THEN
    -- Extrair primeiro bloco da sessão
    first_block := first_session->'blocks'->0;
    
    IF first_block IS NOT NULL THEN
      -- Extrair preview_image_url (primeiro bloco de imagem encontrado que NÃO seja base64)
      IF first_block->>'type' = 'image' 
         AND first_block->>'imageUrl' IS NOT NULL 
         AND first_block->>'imageUrl' NOT LIKE 'data:%' THEN
        NEW.preview_image_url := first_block->>'imageUrl';
      ELSE
        -- Procurar em outros blocos por imagem (ignorando base64)
        SELECT b->>'imageUrl' INTO NEW.preview_image_url
        FROM jsonb_array_elements(first_session->'blocks') AS b
        WHERE b->>'type' = 'image' 
          AND b->>'imageUrl' IS NOT NULL
          AND b->>'imageUrl' NOT LIKE 'data:%'
        LIMIT 1;
      END IF;
      
      -- Extrair preview_text (primeiro bloco de texto encontrado)
      IF first_block->>'type' = 'text' THEN
        NEW.preview_text := LEFT(first_block->>'content', 500);
      ELSE
        -- Procurar em outros blocos por texto
        SELECT LEFT(b->>'content', 500) INTO NEW.preview_text
        FROM jsonb_array_elements(first_session->'blocks') AS b
        WHERE b->>'type' = 'text' AND b->>'content' IS NOT NULL
        LIMIT 1;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;