-- Atualizar view drive_cards para incluir flags de imagem base64
DROP VIEW IF EXISTS drive_cards;

CREATE VIEW drive_cards AS
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
    p.avatar_url AS creator_avatar_url,
    -- Detectar se existe imagem base64 (sem retornar o base64 em si)
    CASE 
        WHEN c.preview_image_url IS NOT NULL THEN false
        WHEN EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(c.sessions) AS session,
                 jsonb_array_elements(session->'blocks') AS block
            WHERE block->>'type' = 'image' 
              AND block->'config'->>'imageUrl' LIKE 'data:image/%'
        ) THEN true
        ELSE false
    END AS has_pending_thumbnail
FROM copies c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.is_template = false;