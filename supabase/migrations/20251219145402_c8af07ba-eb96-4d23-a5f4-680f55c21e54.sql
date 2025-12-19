-- Recriar drive_cards com SECURITY INVOKER para herdar RLS da tabela copies
DROP VIEW IF EXISTS public.drive_cards;
CREATE VIEW public.drive_cards 
WITH (security_invoker = true)
AS
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