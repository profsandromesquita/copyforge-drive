-- Trigger melhorado para extrair preview de TODOS os tipos de blocos textuais
CREATE OR REPLACE FUNCTION public.extract_copy_previews()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  first_session JSONB;
  first_block JSONB;
  block_record JSONB;
  extracted_text TEXT := NULL;
BEGIN
  -- Extrair primeira sessão
  first_session := NEW.sessions->0;
  
  IF first_session IS NOT NULL THEN
    -- 1. Extrair preview_image_url (mantém lógica existente)
    FOR block_record IN SELECT * FROM jsonb_array_elements(first_session->'blocks')
    LOOP
      IF block_record->>'type' = 'image' 
         AND block_record->'config'->>'imageUrl' IS NOT NULL 
         AND block_record->'config'->>'imageUrl' NOT LIKE 'data:%' THEN
        NEW.preview_image_url := block_record->'config'->>'imageUrl';
        EXIT; -- Encontrou imagem, sair do loop
      END IF;
    END LOOP;
    
    -- 2. Extrair preview_text de QUALQUER bloco textual (ordem de prioridade)
    -- Prioridade: headline > subheadline > text > button > testimonial > list
    
    -- Tentar headline primeiro
    SELECT b->>'content' INTO extracted_text
    FROM jsonb_array_elements(first_session->'blocks') AS b
    WHERE b->>'type' = 'headline' 
      AND b->>'content' IS NOT NULL 
      AND TRIM(b->>'content') != ''
    LIMIT 1;
    
    -- Se não achou headline, tentar subheadline
    IF extracted_text IS NULL OR TRIM(extracted_text) = '' THEN
      SELECT b->>'content' INTO extracted_text
      FROM jsonb_array_elements(first_session->'blocks') AS b
      WHERE b->>'type' = 'subheadline' 
        AND b->>'content' IS NOT NULL 
        AND TRIM(b->>'content') != ''
      LIMIT 1;
    END IF;
    
    -- Se não achou subheadline, tentar text
    IF extracted_text IS NULL OR TRIM(extracted_text) = '' THEN
      SELECT b->>'content' INTO extracted_text
      FROM jsonb_array_elements(first_session->'blocks') AS b
      WHERE b->>'type' = 'text' 
        AND b->>'content' IS NOT NULL 
        AND TRIM(b->>'content') != ''
      LIMIT 1;
    END IF;
    
    -- Se não achou text, tentar button
    IF extracted_text IS NULL OR TRIM(extracted_text) = '' THEN
      SELECT b->>'content' INTO extracted_text
      FROM jsonb_array_elements(first_session->'blocks') AS b
      WHERE b->>'type' = 'button' 
        AND b->>'content' IS NOT NULL 
        AND TRIM(b->>'content') != ''
      LIMIT 1;
    END IF;
    
    -- Se não achou button, tentar testimonial (campo quote)
    IF extracted_text IS NULL OR TRIM(extracted_text) = '' THEN
      SELECT b->'config'->>'quote' INTO extracted_text
      FROM jsonb_array_elements(first_session->'blocks') AS b
      WHERE b->>'type' = 'testimonial' 
        AND b->'config'->>'quote' IS NOT NULL 
        AND TRIM(b->'config'->>'quote') != ''
      LIMIT 1;
    END IF;
    
    -- Se não achou testimonial, tentar list (primeiro item)
    IF extracted_text IS NULL OR TRIM(extracted_text) = '' THEN
      SELECT b->'config'->'items'->>0 INTO extracted_text
      FROM jsonb_array_elements(first_session->'blocks') AS b
      WHERE b->>'type' = 'list' 
        AND jsonb_array_length(b->'config'->'items') > 0
      LIMIT 1;
    END IF;
    
    -- Atribuir preview_text se encontrou algo
    IF extracted_text IS NOT NULL AND TRIM(extracted_text) != '' THEN
      NEW.preview_text := LEFT(extracted_text, 500);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Backfill: Atualizar copies existentes que têm sessions mas preview_text NULL
-- Re-triggar o trigger fazendo um UPDATE "dummy" no campo sessions
UPDATE copies 
SET sessions = sessions 
WHERE preview_text IS NULL 
  AND sessions IS NOT NULL 
  AND jsonb_array_length(sessions) > 0
  AND jsonb_array_length(sessions->0->'blocks') > 0;