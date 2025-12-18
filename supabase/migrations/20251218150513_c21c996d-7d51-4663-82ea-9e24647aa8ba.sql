-- =====================================================
-- FASE 1: PROTEÇÃO DE PII NA TABELA PROFILES
-- =====================================================

-- Remover política permissiva que permite colegas verem linha completa
DROP POLICY IF EXISTS "Users can view profiles in shared workspaces" ON public.profiles;

-- Política 1: Usuário vê TUDO do próprio perfil
CREATE POLICY "Users can view own full profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política 2: Super admins veem todos os perfis (necessário para admin panel)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'));

-- NOTA: Colegas de workspace agora só acessam dados públicos via VIEW basic_profiles
-- A VIEW basic_profiles já existe e expõe apenas: id, name, email, avatar_url, created_at
-- Isso elimina o vazamento de CPF, telefone, endereço para colegas