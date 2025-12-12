-- ============================================
-- HIGIENE DE SEGURANÇA: webhook_events_summary
-- ============================================
-- Revogar acesso desnecessário para roles que não precisam ver logs de webhook
-- Apenas service_role e super admins (via tabela webhook_logs com RLS) devem ter acesso

REVOKE SELECT ON public.webhook_events_summary FROM anon;
REVOKE SELECT ON public.webhook_events_summary FROM authenticated;