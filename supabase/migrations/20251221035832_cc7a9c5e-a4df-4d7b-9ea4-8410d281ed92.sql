-- Adicionar campo credits_granted na tabela workspace_invoices
-- Este campo armazena quantos créditos foram concedidos por aquela compra específica
ALTER TABLE workspace_invoices 
ADD COLUMN credits_granted NUMERIC DEFAULT 0;

-- Adicionar comentário explicativo
COMMENT ON COLUMN workspace_invoices.credits_granted IS 'Quantidade de créditos concedidos nesta compra. Usado para remoção exata em caso de chargeback/reembolso.';

-- Migração retroativa: popular credits_granted para invoices existentes baseado no plano
UPDATE workspace_invoices wi
SET credits_granted = sp.credits_per_month
FROM workspace_subscriptions ws
JOIN subscription_plans sp ON ws.plan_id = sp.id
WHERE wi.subscription_id = ws.id
AND (wi.credits_granted IS NULL OR wi.credits_granted = 0);