-- Etapa 1: Refatorar handle_new_user() com bypass efetivo de RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Força bypass de RLS executando como postgres
  PERFORM set_config('role', 'postgres', true);
  
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Log erro de email duplicado
    INSERT INTO public.signup_errors (user_id, error_message, error_detail)
    VALUES (NEW.id, 'Email já cadastrado', SQLERRM);
    RAISE EXCEPTION 'Email % já está em uso', NEW.email;
  WHEN OTHERS THEN
    -- Log outros erros
    INSERT INTO public.signup_errors (user_id, error_message, error_detail)
    VALUES (NEW.id, 'Erro ao criar profile', SQLERRM);
    RAISE;
END;
$$;

-- Conceder permissões explícitas para handle_new_user
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Etapa 2: Refatorar create_default_workspace() com bypass efetivo de RLS
CREATE OR REPLACE FUNCTION public.create_default_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Força bypass de RLS executando como postgres
  PERFORM set_config('role', 'postgres', true);
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, created_by)
  VALUES ('Meu Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner of the workspace (incluindo invited_by)
  INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (new_workspace_id, NEW.id, 'owner', NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log erro com detalhes
    INSERT INTO public.signup_errors (user_id, error_message, error_detail)
    VALUES (NEW.id, 'Erro ao criar workspace padrão', SQLERRM);
    RAISE;
END;
$$;

-- Conceder permissões explícitas para create_default_workspace
GRANT EXECUTE ON FUNCTION public.create_default_workspace() TO postgres;
GRANT EXECUTE ON FUNCTION public.create_default_workspace() TO authenticator;

-- Etapa 3: Garantir permissões para inserir em signup_errors
GRANT INSERT ON public.signup_errors TO postgres;
GRANT INSERT ON public.signup_errors TO supabase_auth_admin;
GRANT INSERT ON public.signup_errors TO authenticator;