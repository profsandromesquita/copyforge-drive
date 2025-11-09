-- Corrigir função para criar créditos baseado no plano FREE (5 créditos)
CREATE OR REPLACE FUNCTION public.create_workspace_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_free_plan_credits numeric;
BEGIN
  -- Buscar créditos do plano FREE
  SELECT credits_per_month INTO v_free_plan_credits
  FROM subscription_plans
  WHERE slug = 'free' AND is_active = true
  LIMIT 1;
  
  -- Usar 5 como fallback se não encontrar
  v_free_plan_credits := COALESCE(v_free_plan_credits, 5.0);
  
  -- Criar registro de créditos com valor do plano FREE
  INSERT INTO public.workspace_credits (workspace_id, balance, total_added)
  VALUES (NEW.id, v_free_plan_credits, v_free_plan_credits);
  
  RETURN NEW;
END;
$function$;

-- Atualizar workspaces existentes com 100 créditos para ter apenas 5
UPDATE workspace_credits 
SET balance = 5.0, 
    total_added = 5.0
WHERE balance = 100.0 
  AND total_added = 100.0
  AND workspace_id IN (
    SELECT ws.workspace_id 
    FROM workspace_subscriptions ws
    JOIN subscription_plans sp ON ws.plan_id = sp.id
    WHERE sp.slug = 'free' AND ws.status = 'active'
  );