-- Função para deletar workspace (apenas se não tiver copies)
CREATE OR REPLACE FUNCTION public.delete_workspace_admin(p_workspace_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_copies_count INTEGER;
BEGIN
  -- Verificar se é super admin
  IF NOT has_system_role(auth.uid(), 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  
  -- Verificar se workspace existe
  IF NOT EXISTS (SELECT 1 FROM workspaces WHERE id = p_workspace_id) THEN
    RETURN json_build_object('success', false, 'error', 'workspace_not_found');
  END IF;
  
  -- Verificar se tem copies criadas
  SELECT COUNT(*) INTO v_copies_count
  FROM copies
  WHERE workspace_id = p_workspace_id AND is_template = false;
  
  IF v_copies_count > 0 THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'workspace_has_copies',
      'copies_count', v_copies_count
    );
  END IF;
  
  -- Deletar projetos do workspace (CASCADE vai cuidar das relações)
  DELETE FROM projects WHERE workspace_id = p_workspace_id;
  
  -- Deletar workspace (CASCADE vai cuidar de members, subscriptions, credits, etc)
  DELETE FROM workspaces WHERE id = p_workspace_id;
  
  RETURN json_build_object('success', true);
END;
$function$;