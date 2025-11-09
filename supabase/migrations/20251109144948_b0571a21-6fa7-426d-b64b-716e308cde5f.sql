-- Etapa 1: Remover RAISE EXCEPTION da função handle_user_signup()
-- Objetivo: Eliminar erro 500 e permitir signup sempre

CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Bypass RLS
  PERFORM set_config('role', 'postgres', true);
  
  BEGIN
    -- 1. Criar profile
    INSERT INTO public.profiles (id, email, name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Log silencioso, não bloqueia signup
      INSERT INTO public.signup_errors (user_id, error_message, error_detail)
      VALUES (NEW.id, 'Profile já existe', SQLERRM)
      ON CONFLICT DO NOTHING;
      -- Continua execução
    WHEN OTHERS THEN
      -- Log silencioso, não bloqueia signup
      INSERT INTO public.signup_errors (user_id, error_message, error_detail)
      VALUES (NEW.id, 'Erro ao criar profile', SQLERRM)
      ON CONFLICT DO NOTHING;
      -- Continua execução
  END;
  
  BEGIN
    -- 2. Criar workspace
    INSERT INTO public.workspaces (name, created_by)
    VALUES ('Meu Workspace', NEW.id)
    RETURNING id INTO new_workspace_id;
    
    -- 3. Adicionar user como owner
    IF new_workspace_id IS NOT NULL THEN
      INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
      VALUES (new_workspace_id, NEW.id, 'owner', NEW.id);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log silencioso, não bloqueia signup
      INSERT INTO public.signup_errors (user_id, error_message, error_detail)
      VALUES (NEW.id, 'Erro ao criar workspace/membership', SQLERRM)
      ON CONFLICT DO NOTHING;
      -- Continua execução
  END;
  
  -- SEMPRE retorna NEW - signup nunca falha
  RETURN NEW;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO authenticator;