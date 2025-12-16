-- VIEW drive_cards: Projeção otimizada para listagem do Drive
-- Elimina over-fetching do campo sessions (206KB média → 500 bytes)
CREATE OR REPLACE VIEW drive_cards AS
SELECT 
  c.id,
  c.title,
  c.copy_type,
  c.status,
  c.folder_id,
  c.project_id,
  c.workspace_id,
  c.created_by,
  c.created_at,
  c.updated_at,
  -- Data Projection: Extrair preview_image_url diretamente no SQL
  TRIM(BOTH '"' FROM 
    jsonb_path_query_first(
      c.sessions, 
      '$[*]."blocks"[*]?(@."type" == "image")."config"."imageUrl"'
    )::text
  ) AS preview_image_url,
  -- Data Projection: Extrair preview_text (primeiros 150 chars)
  LEFT(TRIM(BOTH '"' FROM 
    jsonb_path_query_first(
      c.sessions, 
      '$[*]."blocks"[*]?(@."type" == "text" || @."type" == "headline")."content"'
    )::text
  ), 150) AS preview_text,
  -- Creator info via basic_profiles (sem PII)
  bp.name AS creator_name,
  bp.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN basic_profiles bp ON c.created_by = bp.id
WHERE c.is_template = false;

-- Índice composto para navegação em pastas do Drive
CREATE INDEX IF NOT EXISTS idx_copies_drive_folder 
ON copies (workspace_id, folder_id, created_at DESC) 
WHERE is_template = false;

-- Índice para filtro por projeto no Drive
CREATE INDEX IF NOT EXISTS idx_copies_drive_project 
ON copies (workspace_id, project_id, created_at DESC) 
WHERE is_template = false;