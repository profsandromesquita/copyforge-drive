-- Criar view para monitorar usuários sem workspace
CREATE OR REPLACE VIEW public.users_without_workspace AS
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

-- Comentário na view
COMMENT ON VIEW public.users_without_workspace IS 
'Monitora usuários que não possuem workspace membership. Útil para detectar falhas no setup de novos usuários.';

-- Criar função para auto-correção que pode ser chamada periodicamente
CREATE OR REPLACE FUNCTION public.auto_fix_orphaned_users()
RETURNS TABLE(
  fixed_count INTEGER,
  error_count INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fixed INTEGER := 0;
  v_errors INTEGER := 0;
  v_details JSONB := '[]'::JSONB;
  v_user RECORD;
  v_workspace_id UUID;
BEGIN
  FOR v_user IN SELECT * FROM users_without_workspace LOOP
    BEGIN
      -- Verificar se tem workspace criado
      SELECT id INTO v_workspace_id
      FROM workspaces
      WHERE created_by = v_user.id
      LIMIT 1;
      
      IF v_workspace_id IS NOT NULL THEN
        -- Adicionar membership
        INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
        VALUES (v_workspace_id, v_user.id, 'owner', v_user.id)
        ON CONFLICT DO NOTHING;
        
        v_fixed := v_fixed + 1;
        v_details := v_details || jsonb_build_object(
          'user_id', v_user.id,
          'email', v_user.email,
          'action', 'added_membership',
          'workspace_id', v_workspace_id
        );
      ELSE
        -- Criar workspace e membership
        INSERT INTO workspaces (name, created_by)
        VALUES ('Meu Workspace', v_user.id)
        RETURNING id INTO v_workspace_id;
        
        INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
        VALUES (v_workspace_id, v_user.id, 'owner', v_user.id);
        
        v_fixed := v_fixed + 1;
        v_details := v_details || jsonb_build_object(
          'user_id', v_user.id,
          'email', v_user.email,
          'action', 'created_workspace',
          'workspace_id', v_workspace_id
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_details := v_details || jsonb_build_object(
        'user_id', v_user.id,
        'email', v_user.email,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_fixed, v_errors, v_details;
END;
$$;