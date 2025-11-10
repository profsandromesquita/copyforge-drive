-- Refatorar função change_workspace_plan para usar ofertas flexíveis
DROP FUNCTION IF EXISTS public.change_workspace_plan(uuid, uuid, billing_cycle_type, text);

CREATE OR REPLACE FUNCTION public.change_workspace_plan(
  p_workspace_id uuid,
  p_plan_offer_id uuid,
  p_payment_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_subscription workspace_subscriptions%ROWTYPE;
  v_offer plan_offers%ROWTYPE;
  v_new_plan subscription_plans%ROWTYPE;
  v_new_subscription_id UUID;
  v_requires_payment BOOLEAN;
  v_amount_to_pay NUMERIC;
  v_billing_cycle billing_cycle_type;
  v_period_end TIMESTAMPTZ;
BEGIN
  -- Verificar se é admin do workspace
  IF NOT is_workspace_admin(auth.uid(), p_workspace_id) THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  
  -- Buscar subscription atual
  SELECT * INTO v_current_subscription
  FROM workspace_subscriptions
  WHERE workspace_id = p_workspace_id AND status = 'active'
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'no_active_subscription');
  END IF;
  
  -- Buscar oferta selecionada
  SELECT * INTO v_offer
  FROM plan_offers
  WHERE id = p_plan_offer_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'offer_not_found');
  END IF;
  
  -- Buscar plano da oferta
  SELECT * INTO v_new_plan
  FROM subscription_plans
  WHERE id = v_offer.plan_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'plan_not_found');
  END IF;
  
  -- Validar downgrade - Projetos
  IF v_new_plan.max_projects IS NOT NULL 
     AND v_current_subscription.projects_count > v_new_plan.max_projects THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'projects_limit_exceeded',
      'current_count', v_current_subscription.projects_count,
      'new_limit', v_new_plan.max_projects
    );
  END IF;
  
  -- Validar downgrade - Copies
  IF v_new_plan.max_copies IS NOT NULL 
     AND v_current_subscription.copies_count > v_new_plan.max_copies THEN
    RETURN json_build_object(
      'success', false,
      'error', 'copies_limit_exceeded',
      'current_count', v_current_subscription.copies_count,
      'new_limit', v_new_plan.max_copies
    );
  END IF;
  
  -- Determinar se requer pagamento
  v_requires_payment := (v_offer.price > 0);
  v_amount_to_pay := v_offer.price;
  
  -- Determinar billing_cycle baseado na oferta
  IF v_offer.billing_period_value = 1 AND v_offer.billing_period_unit = 'months' THEN
    v_billing_cycle := 'monthly';
  ELSIF v_offer.billing_period_value = 12 AND v_offer.billing_period_unit = 'months' THEN
    v_billing_cycle := 'annual';
  ELSE
    v_billing_cycle := 'monthly'; -- padrão
  END IF;
  
  -- Calcular período de fim baseado na oferta
  CASE v_offer.billing_period_unit
    WHEN 'days' THEN
      v_period_end := NOW() + (v_offer.billing_period_value || ' days')::INTERVAL;
    WHEN 'months' THEN
      v_period_end := NOW() + (v_offer.billing_period_value || ' months')::INTERVAL;
    WHEN 'years' THEN
      v_period_end := NOW() + (v_offer.billing_period_value || ' years')::INTERVAL;
    WHEN 'lifetime' THEN
      v_period_end := NULL;
    ELSE
      v_period_end := NOW() + INTERVAL '1 month';
  END CASE;
  
  -- Cancelar subscription atual
  UPDATE workspace_subscriptions
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE id = v_current_subscription.id;
  
  -- Criar nova subscription
  INSERT INTO workspace_subscriptions (
    workspace_id,
    plan_id,
    plan_offer_id,
    billing_cycle,
    status,
    current_max_projects,
    current_max_copies,
    current_copy_ai_enabled,
    projects_count,
    copies_count,
    current_period_start,
    current_period_end
  ) VALUES (
    p_workspace_id,
    v_new_plan.id,
    p_plan_offer_id,
    v_billing_cycle,
    CASE WHEN v_requires_payment AND p_payment_id IS NULL THEN 'pending_payment'::subscription_status ELSE 'active'::subscription_status END,
    v_new_plan.max_projects,
    v_new_plan.max_copies,
    v_new_plan.copy_ai_enabled,
    v_current_subscription.projects_count,
    v_current_subscription.copies_count,
    NOW(),
    v_period_end
  ) RETURNING id INTO v_new_subscription_id;
  
  -- Ajustar créditos
  UPDATE workspace_credits
  SET 
    balance = balance + v_new_plan.credits_per_month,
    total_added = total_added + v_new_plan.credits_per_month
  WHERE workspace_id = p_workspace_id;
  
  -- Registrar transação de crédito
  INSERT INTO credit_transactions (
    workspace_id,
    user_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  )
  SELECT 
    p_workspace_id,
    auth.uid(),
    'credit',
    v_new_plan.credits_per_month,
    wc.balance - v_new_plan.credits_per_month,
    wc.balance,
    'Créditos do plano ' || v_new_plan.name || ' (' || v_offer.name || ')'
  FROM workspace_credits wc
  WHERE wc.workspace_id = p_workspace_id;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'new_subscription_id', v_new_subscription_id,
    'requires_payment', v_requires_payment AND p_payment_id IS NULL,
    'amount_to_pay', v_amount_to_pay,
    'message', 'Plano alterado com sucesso'
  );
END;
$function$;

-- Adicionar comentários de depreciação
COMMENT ON COLUMN subscription_plans.monthly_price IS 'DEPRECATED: Use plan_offers table';
COMMENT ON COLUMN subscription_plans.annual_price IS 'DEPRECATED: Use plan_offers table';
COMMENT ON COLUMN subscription_plans.checkout_url_monthly IS 'DEPRECATED: Use plan_offers table';
COMMENT ON COLUMN subscription_plans.checkout_url_annual IS 'DEPRECATED: Use plan_offers table';