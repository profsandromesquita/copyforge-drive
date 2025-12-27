-- Corrigir função handle_user_signup removendo set_config que causa erro
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY DEFINER já executa com privilégios do owner
  -- NÃO usar set_config('role', ...) - isso causa o erro
  
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
$function$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_user_signup() TO authenticator;