-- FASE 1: VIEW otimizada para o Discover com Data Projection
-- Elimina download do sessions inteiro, extrai apenas preview de imagem/texto

CREATE OR REPLACE VIEW public.discover_cards AS
SELECT 
  c.id,
  c.title,
  c.copy_type,
  c.copy_count,
  c.likes_count,
  c.created_by,
  c.created_at,
  -- Extrai primeira URL de imagem diretamente via SQL (evita download do sessions)
  TRIM(BOTH '"' FROM (
    jsonb_path_query_first(
      c.sessions,
      '$[*].blocks[*] ? (@.type == "image").config.imageUrl'
    )::text
  )) AS preview_image_url,
  -- Extrai primeiros 150 chars de texto para preview
  LEFT(
    TRIM(BOTH '"' FROM (
      jsonb_path_query_first(
        c.sessions,
        '$[*].blocks[*] ? (@.type == "text" || @.type == "headline").content'
      )::text
    )),
    150
  ) AS preview_text,
  -- Creator info via JOIN
  p.name AS creator_name,
  p.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.show_in_discover = true;

-- Permissões para VIEW
GRANT SELECT ON public.discover_cards TO anon, authenticated;

-- Índices otimizados para ordenação no Discover
CREATE INDEX IF NOT EXISTS idx_copies_discover_created_at 
ON copies(created_at DESC) 
WHERE show_in_discover = true;

CREATE INDEX IF NOT EXISTS idx_copies_discover_likes 
ON copies(likes_count DESC) 
WHERE show_in_discover = true;

CREATE INDEX IF NOT EXISTS idx_copies_discover_copy_count 
ON copies(copy_count DESC) 
WHERE show_in_discover = true;

-- Índice para busca por título
CREATE INDEX IF NOT EXISTS idx_copies_discover_title 
ON copies(title text_pattern_ops) 
WHERE show_in_discover = true;