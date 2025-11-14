-- Corrigir search_path da função de trigger

DROP FUNCTION IF EXISTS public.update_user_prompt_customizations_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_user_prompt_customizations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER update_user_prompt_customizations_updated_at
  BEFORE UPDATE ON public.user_prompt_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_prompt_customizations_updated_at();