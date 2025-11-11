-- Função para deletar usuário (apenas se não tiver workspaces e copies)
CREATE OR REPLACE FUNCTION public.delete_user_admin(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspaces_count integer;
  v_copies_count integer;
BEGIN
  -- Verificar se é super admin
  IF NOT has_system_role(auth.uid(), 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  
  -- Verificar se usuário existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;
  
  -- Contar workspaces
  SELECT COUNT(*) INTO v_workspaces_count
  FROM workspace_members
  WHERE user_id = p_user_id;
  
  -- Contar copies
  SELECT COUNT(*) INTO v_copies_count
  FROM copies
  WHERE created_by = p_user_id;
  
  -- Verificar se pode deletar
  IF v_workspaces_count > 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'user_has_workspaces',
      'workspaces_count', v_workspaces_count
    );
  END IF;
  
  IF v_copies_count > 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'user_has_copies',
      'copies_count', v_copies_count
    );
  END IF;
  
  -- Deletar profile (CASCADE vai cuidar do resto)
  DELETE FROM profiles WHERE id = p_user_id;
  
  -- Deletar da auth.users
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN json_build_object('success', true);
END;
$$;