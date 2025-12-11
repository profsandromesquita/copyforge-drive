-- ============================================
-- HARDENING DE SEGURANÇA: Fase Final
-- ============================================

-- ============================================
-- 1. COPIES: Remover acesso público à tabela
-- (Público agora usa a VIEW public_copies)
-- ============================================
DROP POLICY IF EXISTS "Public copies are viewable by anyone" ON public.copies;

-- ============================================
-- 2. PROFILES: Restringir a authenticated
-- ============================================
DROP POLICY IF EXISTS "Users can view profiles in shared workspaces" ON public.profiles;

CREATE POLICY "Users can view profiles in shared workspaces"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) 
  OR has_system_role(auth.uid(), 'super_admin'::system_role) 
  OR (EXISTS (
    SELECT 1 FROM workspace_members wm1
    JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
  ))
);

-- ============================================
-- 3. WEBHOOK_LOGS: Hardening completo
-- ============================================
-- Remover políticas antigas
DROP POLICY IF EXISTS "Super admins can view logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.webhook_logs;

-- SELECT apenas para super admins autenticados
CREATE POLICY "Super admins can view logs"
ON public.webhook_logs FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'::system_role));

-- INSERT restrito a service_role (Edge Functions)
-- Authenticated users não podem inserir logs
CREATE POLICY "Only service role can insert logs"
ON public.webhook_logs FOR INSERT
TO service_role
WITH CHECK (true);