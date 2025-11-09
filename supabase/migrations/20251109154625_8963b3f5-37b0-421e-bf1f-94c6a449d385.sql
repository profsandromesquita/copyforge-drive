-- Criar tabela de log de erros de signup (se não existir)
CREATE TABLE IF NOT EXISTS public.signup_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_message TEXT,
  error_detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para corrigir usuários sem workspace
CREATE OR REPLACE FUNCTION public.fix_users_without_workspace()
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  workspace_created BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_workspace_id UUID;
BEGIN
  -- Encontrar todos os usuários sem workspace
  FOR v_user IN 
    SELECT p.id, p.email, p.name
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.user_id = p.id
    )
  LOOP
    BEGIN
      -- Criar workspace
      INSERT INTO public.workspaces (name, created_by)
      VALUES ('Meu Workspace', v_user.id)
      RETURNING id INTO v_workspace_id;
      
      -- Adicionar user como owner
      INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
      VALUES (v_workspace_id, v_user.id, 'owner', v_user.id);
      
      -- Retornar sucesso
      RETURN QUERY SELECT 
        v_user.id,
        v_user.email,
        true,
        'Workspace criado com sucesso'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
      -- Retornar erro
      RETURN QUERY SELECT 
        v_user.id,
        v_user.email,
        false,
        SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Executar correção retroativa
SELECT * FROM public.fix_users_without_workspace();

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_lookup 
ON public.workspace_members(user_id) 
WHERE user_id IS NOT NULL;