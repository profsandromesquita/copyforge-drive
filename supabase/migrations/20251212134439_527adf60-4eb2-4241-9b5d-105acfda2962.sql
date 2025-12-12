-- ============================================
-- SECURE VIEW: basic_profiles (PII Protection)
-- ============================================
-- VIEW que expõe apenas dados públicos/básicos de perfil
-- Campos sensíveis (CPF, endereço, telefone) ficam protegidos na tabela original

CREATE OR REPLACE VIEW public.basic_profiles AS
SELECT 
  id,
  name,
  email,
  avatar_url,
  created_at
FROM public.profiles;

-- Comentário para documentação
COMMENT ON VIEW public.basic_profiles IS 'VIEW segura para dados públicos de perfil (sem PII). Use esta view para listar membros de workspace e exibir avatares.';

-- Conceder acesso para usuários autenticados
GRANT SELECT ON public.basic_profiles TO authenticated;

-- Revogar acesso anônimo (segurança)
REVOKE ALL ON public.basic_profiles FROM anon;

-- ============================================
-- HARDENING: RLS da tabela profiles original
-- ============================================
-- Remover política que permite ver perfis de membros do mesmo workspace
-- (agora eles usarão a VIEW basic_profiles)

DROP POLICY IF EXISTS "Users can view profiles in shared workspaces" ON public.profiles;

-- Criar política restritiva: apenas próprio perfil ou super_admin
CREATE POLICY "Users can only view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR has_system_role(auth.uid(), 'super_admin'::system_role)
);