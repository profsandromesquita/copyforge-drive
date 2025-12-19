-- Fase 1: Adicionar colunas desnormalizadas na tabela copies
ALTER TABLE public.copies 
ADD COLUMN IF NOT EXISTS preview_image_url TEXT,
ADD COLUMN IF NOT EXISTS preview_text TEXT;

-- Fase 2: Criar função para extrair previews do JSON sessions
CREATE OR REPLACE FUNCTION public.extract_copy_previews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
      -- Extrair preview_image_url (primeiro bloco de imagem encontrado)
      IF first_block->>'type' = 'image' THEN
        NEW.preview_image_url := first_block->>'imageUrl';
      ELSE
        -- Procurar em outros blocos por imagem
        SELECT b->>'imageUrl' INTO NEW.preview_image_url
        FROM jsonb_array_elements(first_session->'blocks') AS b
        WHERE b->>'type' = 'image' AND b->>'imageUrl' IS NOT NULL
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
$$;

-- Fase 3: Criar trigger para auto-popular em INSERT/UPDATE
DROP TRIGGER IF EXISTS trigger_extract_copy_previews ON public.copies;
CREATE TRIGGER trigger_extract_copy_previews
  BEFORE INSERT OR UPDATE OF sessions ON public.copies
  FOR EACH ROW
  EXECUTE FUNCTION public.extract_copy_previews();

-- Fase 4: Backfill - Popular dados existentes
UPDATE public.copies c
SET 
  preview_image_url = (
    SELECT b->>'imageUrl'
    FROM jsonb_array_elements(c.sessions->0->'blocks') AS b
    WHERE b->>'type' = 'image' AND b->>'imageUrl' IS NOT NULL
    LIMIT 1
  ),
  preview_text = (
    SELECT LEFT(b->>'content', 500)
    FROM jsonb_array_elements(c.sessions->0->'blocks') AS b
    WHERE b->>'type' = 'text' AND b->>'content' IS NOT NULL
    LIMIT 1
  )
WHERE c.sessions IS NOT NULL AND jsonb_array_length(c.sessions) > 0;

-- Fase 5: Recriar a View drive_cards usando as novas colunas desnormalizadas
DROP VIEW IF EXISTS public.drive_cards;
CREATE VIEW public.drive_cards AS
SELECT 
  c.id,
  c.folder_id,
  c.project_id,
  c.workspace_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  c.title,
  c.copy_type,
  c.status,
  c.preview_image_url,
  c.preview_text,
  p.name AS creator_name,
  p.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.is_template = false;

-- Criar índices nas novas colunas para queries futuras (opcional mas recomendado)
CREATE INDEX IF NOT EXISTS idx_copies_preview_image ON public.copies (preview_image_url) WHERE preview_image_url IS NOT NULL;