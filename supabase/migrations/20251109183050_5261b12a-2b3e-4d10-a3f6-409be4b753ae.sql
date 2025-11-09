-- Remove trigger duplicado que está causando conflito em workspace_subscriptions
-- Mantém apenas assign_plan_on_workspace_create que é mais completo

DROP TRIGGER IF EXISTS trigger_create_default_subscription ON workspaces;
DROP FUNCTION IF EXISTS create_default_subscription();

-- Verificar que apenas um trigger permanece
-- assign_plan_on_workspace_create já existe e é suficiente