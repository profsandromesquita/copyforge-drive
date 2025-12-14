-- Remove a constraint UNIQUE que impede múltiplas subscriptions por workspace
ALTER TABLE workspace_subscriptions
DROP CONSTRAINT IF EXISTS workspace_subscriptions_workspace_id_key;

-- Garante que só pode existir UMA subscription com status='active' por workspace
-- Isso permite manter histórico de subscriptions canceladas
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_subscription_per_workspace
ON workspace_subscriptions (workspace_id)
WHERE status = 'active';