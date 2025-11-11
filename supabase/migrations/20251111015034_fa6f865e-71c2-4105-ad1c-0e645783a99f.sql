-- Adicionar colunas para salvar progresso do onboarding na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_current_step integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_custom_occupation text,
ADD COLUMN IF NOT EXISTS onboarding_project_id uuid,
ADD COLUMN IF NOT EXISTS onboarding_project_data jsonb;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.onboarding_current_step IS 'Etapa atual do onboarding do usuário';
COMMENT ON COLUMN public.profiles.onboarding_custom_occupation IS 'Ocupação customizada informada pelo usuário no onboarding';
COMMENT ON COLUMN public.profiles.onboarding_project_id IS 'ID do projeto criado durante o onboarding';
COMMENT ON COLUMN public.profiles.onboarding_project_data IS 'Dados temporários do projeto durante o onboarding';