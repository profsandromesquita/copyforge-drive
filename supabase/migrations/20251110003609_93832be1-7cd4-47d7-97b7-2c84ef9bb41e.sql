-- 1. Atualizar trigger para criar APENAS profile
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Bypass RLS
  PERFORM set_config('role', 'postgres', true);
  
  BEGIN
    -- Criar APENAS profile - workspace será criado no onboarding
    INSERT INTO public.profiles (id, email, name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log silencioso, não bloqueia signup
      INSERT INTO public.signup_errors (user_id, error_message, error_detail)
      VALUES (NEW.id, 'Erro ao criar profile', SQLERRM)
      ON CONFLICT DO NOTHING;
  END;
  
  -- SEMPRE retorna NEW - signup nunca falha
  RETURN NEW;
END;
$$;

-- 2. Adicionar política RLS direta para resolver circular dependency
CREATE POLICY "Users can view their own workspace memberships"
ON public.workspace_members
FOR SELECT
USING (user_id = auth.uid());