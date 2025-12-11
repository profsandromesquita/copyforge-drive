-- =============================================
-- HARDENING FINAL - REMOÇÃO DE POLÍTICAS PERMISSIVAS
-- =============================================

-- =============================================
-- FASE 1: workspace_invitations
-- Remover políticas que permitem acesso anônimo (auth.uid() IS NULL)
-- =============================================

DROP POLICY IF EXISTS "Users can view their own invitations" ON public.workspace_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON public.workspace_invitations;

-- =============================================
-- FASE 2: plan_offers
-- Remover acesso público - dados públicos via VIEW apenas
-- =============================================

DROP POLICY IF EXISTS "Users can view active plan offers" ON public.plan_offers;

-- =============================================
-- FASE 3: system_settings
-- Remover acesso público total - dados públicos via VIEW apenas
-- =============================================

DROP POLICY IF EXISTS "Anyone can view signup status" ON public.system_settings;

-- =============================================
-- FASE 4: copy_likes
-- Recriar políticas INSERT/DELETE com role authenticated explícita
-- =============================================

DROP POLICY IF EXISTS "Users can insert own likes" ON public.copy_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.copy_likes;

CREATE POLICY "Users can insert own likes"
ON public.copy_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON public.copy_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- VALIDAÇÃO: Políticas que DEVEM permanecer
-- =============================================
-- workspace_invitations:
--   ✅ "Workspace admins can create invitations" (INSERT)
--   ✅ "Workspace admins can delete invitations" (DELETE)
--   ✅ "Workspace admins can view invitations" (SELECT)
--
-- plan_offers:
--   ✅ "Super admins can manage plan offers" (ALL)
--
-- system_settings:
--   ✅ "Super admins can view system settings" (SELECT)
--   ✅ "Super admins can update system settings" (UPDATE)
--
-- model_routing_config:
--   ✅ "Anyone can view routing config" (SELECT - já restrita a authenticated)
--   ✅ "Super admins can manage routing config" (ALL)
--
-- copy_likes:
--   ✅ "Users can view own likes" (SELECT)
--   ✅ "Users can insert own likes" (INSERT - TO authenticated)
--   ✅ "Users can delete own likes" (DELETE - TO authenticated)
-- =============================================