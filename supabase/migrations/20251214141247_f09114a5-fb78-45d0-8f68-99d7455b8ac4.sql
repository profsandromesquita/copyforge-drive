-- Remove a FK automática duplicada, mantendo apenas fk_subscriptions_offer
ALTER TABLE workspace_subscriptions
DROP CONSTRAINT IF EXISTS workspace_subscriptions_plan_offer_id_fkey;