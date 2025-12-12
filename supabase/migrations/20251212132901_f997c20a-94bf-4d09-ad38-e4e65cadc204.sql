-- ============================================
-- CONSOLIDAÇÃO: Políticas SELECT de profiles
-- ============================================
-- Remover políticas redundantes (já cobertas pela política "shared workspaces")
-- A política "Users can view profiles in shared workspaces" permanece e cobre:
-- 1. Usuário vendo próprio perfil (auth.uid() = id)
-- 2. Super admins (has_system_role check)
-- 3. Membros do mesmo workspace (JOIN check)

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;