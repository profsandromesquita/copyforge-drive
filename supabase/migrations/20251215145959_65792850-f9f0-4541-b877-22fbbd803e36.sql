-- FASE 1: VIEW otimizada templates_cards com data projection

CREATE OR REPLACE VIEW public.templates_cards AS
SELECT
  c.id,
  c.title,
  c.copy_type,
  c.folder_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  c.workspace_id,
  -- Data projection: extrair preview do JSONB
  TRIM(BOTH '"' FROM (
    jsonb_path_query_first(c.sessions, '$[*].blocks[*] ? (@.type == "image").config.imageUrl')
  )::text) AS preview_image_url,
  TRIM(BOTH '"' FROM LEFT(
    (jsonb_path_query_first(c.sessions, '$[*].blocks[*] ? (@.type == "text" || @.type == "headline").content'))::text,
    150
  )) AS preview_text,
  -- Contadores calculados no SQL
  jsonb_array_length(c.sessions) AS sessions_count,
  (
    SELECT COALESCE(SUM(jsonb_array_length(session->'blocks')), 0)::int
    FROM jsonb_array_elements(c.sessions) AS session
  ) AS blocks_count,
  -- Dados do criador (JOIN com basic_profiles)
  bp.name AS creator_name,
  bp.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN basic_profiles bp ON c.created_by = bp.id
WHERE c.is_template = true;

-- Permissões
GRANT SELECT ON public.templates_cards TO authenticated;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_copies_templates_workspace 
  ON copies(workspace_id) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_copies_templates_created_at 
  ON copies(created_at DESC) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_copies_templates_copy_type 
  ON copies(copy_type) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_copies_templates_created_by 
  ON copies(created_by) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_copies_templates_updated_at
  ON copies(updated_at DESC) WHERE is_template = true;