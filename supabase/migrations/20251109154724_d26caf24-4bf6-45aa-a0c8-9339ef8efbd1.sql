-- Habilitar RLS na tabela signup_errors
ALTER TABLE public.signup_errors ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem ver erros de signup
CREATE POLICY "Super admins can view signup errors"
ON public.signup_errors
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'));

-- Função melhorada para corrigir usuários sem workspace
DROP FUNCTION IF EXISTS public.fix_users_without_workspace();

CREATE OR REPLACE FUNCTION public.fix_orphaned_users()
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  action_taken TEXT,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_workspace_id UUID;
  v_existing_workspace UUID;
BEGIN
  -- Caso 1: Usuários sem nenhuma membership
  FOR v_user IN 
    SELECT p.id, p.email, p.name
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = p.id
    )
  LOOP
    BEGIN
      -- Verificar se já existe workspace criado por esse usuário
      SELECT id INTO v_existing_workspace
      FROM public.workspaces
      WHERE created_by = v_user.id
      LIMIT 1;
      
      IF v_existing_workspace IS NOT NULL THEN
        -- Workspace existe, apenas adicionar membership
        INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
        VALUES (v_existing_workspace, v_user.id, 'owner', v_user.id);
        
        RETURN QUERY SELECT 
          v_user.id,
          v_user.email,
          'Added membership to existing workspace'::TEXT,
          true,
          NULL::TEXT;
      ELSE
        -- Criar novo workspace
        INSERT INTO public.workspaces (name, created_by)
        VALUES ('Meu Workspace', v_user.id)
        RETURNING id INTO v_workspace_id;
        
        -- Adicionar membership
        INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
        VALUES (v_workspace_id, v_user.id, 'owner', v_user.id);
        
        RETURN QUERY SELECT 
          v_user.id,
          v_user.email,
          'Created new workspace and membership'::TEXT,
          true,
          NULL::TEXT;
      END IF;
        
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        v_user.id,
        v_user.email,
        'Failed to fix user'::TEXT,
        false,
        SQLERRM;
    END;
  END LOOP;
  
  -- Caso 2: Limpar subscriptions órfãs (sem workspace válido)
  DELETE FROM public.workspace_subscriptions
  WHERE workspace_id NOT IN (SELECT id FROM public.workspaces);
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      'SYSTEM'::TEXT,
      'Cleaned orphaned subscriptions'::TEXT,
      true,
      NULL::TEXT;
  END IF;
END;
$$;

-- Executar correção
SELECT * FROM public.fix_orphaned_users();