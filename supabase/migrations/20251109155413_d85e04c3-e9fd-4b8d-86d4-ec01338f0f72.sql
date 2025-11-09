-- Recriar view sem SECURITY DEFINER
DROP VIEW IF EXISTS public.users_without_workspace;

CREATE VIEW public.users_without_workspace 
WITH (security_invoker=true)
AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM workspaces WHERE created_by = p.id) THEN 'HAS_WORKSPACE_NO_MEMBERSHIP'
    ELSE 'NO_WORKSPACE_AT_ALL'
  END as issue_type,
  (SELECT error_message FROM signup_errors WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) as last_error
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_members wm
  WHERE wm.user_id = p.id
)
ORDER BY p.created_at DESC;

-- Habilitar RLS na view
ALTER VIEW public.users_without_workspace SET (security_invoker = true);

-- Comentário
COMMENT ON VIEW public.users_without_workspace IS 
'Monitora usuários órfãos sem workspace. Apenas super admins podem visualizar.';