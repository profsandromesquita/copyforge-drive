-- Melhorar função de atribuição automática de planos
CREATE OR REPLACE FUNCTION public.assign_appropriate_plan()
RETURNS TRIGGER AS $$
DECLARE
  v_project_count INTEGER;
  v_copy_count INTEGER;
  v_plan_id UUID;
  v_plan subscription_plans%ROWTYPE;
BEGIN
  -- Contar projetos e copies existentes
  SELECT COUNT(*) INTO v_project_count
  FROM projects WHERE workspace_id = NEW.id;
  
  SELECT COUNT(*) INTO v_copy_count
  FROM copies WHERE workspace_id = NEW.id AND is_template = false;
  
  -- Determinar plano adequado baseado no uso atual
  IF v_project_count > 3 OR v_copy_count > 50 THEN
    -- Business (ilimitado)
    SELECT * INTO v_plan FROM subscription_plans WHERE slug = 'business' AND is_active = true LIMIT 1;
  ELSIF v_project_count > 1 THEN
    -- Pro (até 3 projetos, copies ilimitadas)
    SELECT * INTO v_plan FROM subscription_plans WHERE slug = 'pro' AND is_active = true LIMIT 1;
  ELSIF v_copy_count > 5 THEN
    -- Starter (1 projeto, copies ilimitadas)
    SELECT * INTO v_plan FROM subscription_plans WHERE slug = 'starter' AND is_active = true LIMIT 1;
  ELSE
    -- Free (1 projeto, 5 copies)
    SELECT * INTO v_plan FROM subscription_plans WHERE slug = 'free' AND is_active = true LIMIT 1;
  END IF;
  
  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Nenhum plano adequado encontrado';
  END IF;
  
  -- Criar assinatura com plano adequado e limites atualizados
  INSERT INTO workspace_subscriptions (
    workspace_id, 
    plan_id, 
    billing_cycle, 
    status,
    current_max_projects,
    current_max_copies,
    current_copy_ai_enabled,
    projects_count, 
    copies_count
  ) VALUES (
    NEW.id, 
    v_plan.id, 
    'free', 
    'active',
    v_plan.max_projects,
    v_plan.max_copies,
    v_plan.copy_ai_enabled,
    v_project_count, 
    v_copy_count
  );
  
  -- Atualizar créditos do workspace com valor do plano
  UPDATE workspace_credits
  SET 
    balance = v_plan.credits_per_month,
    total_added = v_plan.credits_per_month
  WHERE workspace_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Substituir trigger existente pela nova função
DROP TRIGGER IF EXISTS assign_plan_on_workspace_create ON workspaces;
CREATE TRIGGER assign_plan_on_workspace_create
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION assign_appropriate_plan();