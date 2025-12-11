-- Criar VIEW segura que expõe apenas dados públicos de copies
-- Oculta: system_instruction, generated_system_prompt, workspace_id, project_id, folder_id, selected_*, copy_* fields
CREATE OR REPLACE VIEW public_copies 
WITH (security_invoker = false)
AS SELECT 
  c.id,
  c.title,
  c.sessions,
  c.copy_type,
  c.copy_count,
  c.likes_count,
  c.created_by,
  c.created_at,
  c.is_public,
  c.show_in_discover,
  c.public_password,
  p.name as creator_name,
  p.avatar_url as creator_avatar_url
FROM copies c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.is_public = true;

-- Conceder acesso público à VIEW (anon para visitantes, authenticated para usuários logados)
GRANT SELECT ON public_copies TO anon, authenticated;