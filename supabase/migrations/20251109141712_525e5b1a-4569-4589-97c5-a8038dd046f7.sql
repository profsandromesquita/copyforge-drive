-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

-- Remover funções antigas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_workspace() CASCADE;

-- Criar função consolidada para signup completo
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
  
  -- 1. Criar profile
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- 2. Criar workspace
  INSERT INTO public.workspaces (name, created_by)
  VALUES ('Meu Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- 3. Adicionar user como owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (new_workspace_id, NEW.id, 'owner', NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.signup_errors (user_id, error_message, error_detail)
    VALUES (NEW.id, 'Email já cadastrado', SQLERRM);
    RAISE EXCEPTION 'Email % já está em uso', NEW.email;
  WHEN OTHERS THEN
    INSERT INTO public.signup_errors (user_id, error_message, error_detail)
    VALUES (NEW.id, 'Erro no signup', SQLERRM);
    RAISE;
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO authenticator;

-- Tentar criar trigger no auth.users
-- Nota: Pode falhar por restrições do Supabase no schema auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_signup();