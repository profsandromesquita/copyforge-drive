-- Corrigir security warning: remover SECURITY DEFINER da view
-- e garantir que ela use permissões do usuário consultante

DROP VIEW IF EXISTS webhook_events_summary;

CREATE VIEW webhook_events_summary 
WITH (security_invoker = true) AS
SELECT 
  integration_slug,
  event_category,
  event_type,
  status,
  COUNT(*) as total_events,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_events,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_events,
  MAX(created_at) as last_event_at
FROM webhook_logs
GROUP BY integration_slug, event_category, event_type, status;