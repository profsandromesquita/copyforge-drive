-- Etapa 1: Corrigir função handle_new_user() para bypass RLS durante signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Desabilita RLS temporariamente para esta função
  SET LOCAL row_security = off;
  
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debug
    RAISE WARNING 'Erro ao criar profile: %', SQLERRM;
    RAISE;
END;
$$;

-- Etapa 2: Corrigir função create_default_workspace() para bypass RLS durante signup
CREATE OR REPLACE FUNCTION public.create_default_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Desabilita RLS temporariamente para esta função
  SET LOCAL row_security = off;
  
  -- Create default workspace
  INSERT INTO public.workspaces (name, created_by)
  VALUES ('Meu Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner of the workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debug
    RAISE WARNING 'Erro ao criar workspace: %', SQLERRM;
    RAISE;
END;
$$;

-- Etapa 3: Adicionar índice único em email para prevenir duplicação
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key 
ON public.profiles(email);

-- Etapa 4: Criar tabela para log de erros de signup (para debug futuro)
CREATE TABLE IF NOT EXISTS public.signup_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_message TEXT,
  error_detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS na tabela de logs pois é apenas para uso interno
ALTER TABLE public.signup_errors DISABLE ROW LEVEL SECURITY;