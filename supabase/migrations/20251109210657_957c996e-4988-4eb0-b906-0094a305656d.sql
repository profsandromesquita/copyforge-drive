-- Adicionar status pending_payment se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending_payment' 
    AND enumtypid = 'subscription_status'::regtype
  ) THEN
    ALTER TYPE subscription_status ADD VALUE 'pending_payment';
  END IF;
END $$;

-- Criar função para mudar plano do workspace
CREATE OR REPLACE FUNCTION change_workspace_plan(
  p_workspace_id UUID,
  p_new_plan_id UUID,
  p_new_billing_cycle billing_cycle_type,
  p_payment_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_subscription workspace_subscriptions%ROWTYPE;
  v_new_plan subscription_plans%ROWTYPE;
  v_new_subscription_id UUID;
  v_requires_payment BOOLEAN;
  v_amount_to_pay NUMERIC;
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
  
  -- Buscar novo plano
  SELECT * INTO v_new_plan
  FROM subscription_plans
  WHERE id = p_new_plan_id AND is_active = true;
  
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
  
  -- Determinar se requer pagamento (upgrades pagos)
  v_requires_payment := (
    (p_new_billing_cycle = 'monthly' AND v_new_plan.monthly_price > 0) OR
    (p_new_billing_cycle = 'annual' AND v_new_plan.annual_price > 0)
  );
  
  -- Calcular valor a pagar
  IF p_new_billing_cycle = 'monthly' THEN
    v_amount_to_pay := v_new_plan.monthly_price;
  ELSE
    v_amount_to_pay := v_new_plan.annual_price;
  END IF;
  
  -- Cancelar subscription atual
  UPDATE workspace_subscriptions
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE id = v_current_subscription.id;
  
  -- Criar nova subscription
  INSERT INTO workspace_subscriptions (
    workspace_id,
    plan_id,
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
    p_new_plan_id,
    p_new_billing_cycle,
    CASE WHEN v_requires_payment AND p_payment_id IS NULL THEN 'pending_payment'::subscription_status ELSE 'active'::subscription_status END,
    v_new_plan.max_projects,
    v_new_plan.max_copies,
    v_new_plan.copy_ai_enabled,
    v_current_subscription.projects_count,
    v_current_subscription.copies_count,
    NOW(),
    CASE 
      WHEN p_new_billing_cycle = 'monthly' THEN NOW() + INTERVAL '1 month'
      WHEN p_new_billing_cycle = 'annual' THEN NOW() + INTERVAL '1 year'
      ELSE NULL
    END
  ) RETURNING id INTO v_new_subscription_id;
  
  -- Ajustar créditos (adicionar créditos do novo plano)
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
    'Créditos do plano ' || v_new_plan.name
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
$$;