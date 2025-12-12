-- =====================================================
-- FASE 1: Corrigir credit_transactions (CRÍTICA)
-- Membros só veem SUAS PRÓPRIAS transações, admins veem todas
-- =====================================================

DROP POLICY IF EXISTS "Workspace members can view their transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own transactions or admins view all"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_workspace_admin(auth.uid(), workspace_id)
  OR has_system_role(auth.uid(), 'super_admin'::system_role)
);

-- =====================================================
-- FASE 2: Criar VIEW segura para dados de plano
-- Expõe apenas dados de uso, sem billing info
-- =====================================================

CREATE OR REPLACE VIEW public.public_workspace_plan_summary AS
SELECT 
  ws.workspace_id,
  sp.name as plan_name,
  sp.slug as plan_slug,
  ws.projects_count,
  ws.copies_count,
  ws.current_max_projects,
  ws.current_max_copies,
  ws.current_copy_ai_enabled,
  sp.credits_per_month
FROM public.workspace_subscriptions ws
JOIN public.subscription_plans sp ON ws.plan_id = sp.id
WHERE ws.status = 'active';

GRANT SELECT ON public.public_workspace_plan_summary TO authenticated;

-- =====================================================
-- FASE 3: Restringir workspace_subscriptions
-- Apenas admins podem ver dados completos de assinatura
-- =====================================================

DROP POLICY IF EXISTS "Workspace members can view their subscription" ON public.workspace_subscriptions;

CREATE POLICY "Workspace admins can view their subscription"
ON public.workspace_subscriptions
FOR SELECT
TO authenticated
USING (
  is_workspace_admin(auth.uid(), workspace_id)
  OR has_system_role(auth.uid(), 'super_admin'::system_role)
);

-- =====================================================
-- FASE 4: Restringir credit_rollover_history
-- Apenas admins podem ver histórico de rollover
-- =====================================================

DROP POLICY IF EXISTS "Workspace members can view their rollover history" ON public.credit_rollover_history;

CREATE POLICY "Workspace admins can view rollover history"
ON public.credit_rollover_history
FOR SELECT
TO authenticated
USING (
  is_workspace_admin(auth.uid(), workspace_id)
  OR has_system_role(auth.uid(), 'super_admin'::system_role)
);