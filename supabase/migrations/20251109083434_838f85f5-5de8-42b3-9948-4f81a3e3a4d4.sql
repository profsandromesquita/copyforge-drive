-- Criar enum para ciclo de cobrança
CREATE TYPE billing_cycle_type AS ENUM ('monthly', 'annual', 'free');

-- Criar enum para status de assinatura
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'past_due');

-- Tabela de planos de assinatura
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Preços
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Limites e Recursos
  max_projects INTEGER, -- NULL = ilimitado
  max_copies INTEGER, -- NULL = ilimitado
  copy_ai_enabled BOOLEAN DEFAULT false,
  credits_per_month NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Rollover de Créditos
  rollover_enabled BOOLEAN DEFAULT false,
  rollover_percentage NUMERIC(5,2) DEFAULT 0,
  rollover_days INTEGER DEFAULT 0,
  
  -- Controle
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de assinaturas dos workspaces
CREATE TABLE workspace_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Ciclo de Faturamento
  billing_cycle billing_cycle_type NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  
  -- Datas
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Limites Atuais (snapshot do plano)
  current_max_projects INTEGER,
  current_max_copies INTEGER,
  current_copy_ai_enabled BOOLEAN,
  
  -- Uso Atual
  projects_count INTEGER DEFAULT 0,
  copies_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workspace_id)
);

-- Tabela de histórico de rollover
CREATE TABLE credit_rollover_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES workspace_subscriptions(id) ON DELETE CASCADE,
  
  original_credits NUMERIC(10,2) NOT NULL,
  rolled_credits NUMERIC(10,2) NOT NULL,
  rollover_percentage NUMERIC(5,2) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_workspace_subscriptions_workspace ON workspace_subscriptions(workspace_id);
CREATE INDEX idx_workspace_subscriptions_plan ON workspace_subscriptions(plan_id);
CREATE INDEX idx_workspace_subscriptions_status ON workspace_subscriptions(status);
CREATE INDEX idx_credit_rollover_workspace ON credit_rollover_history(workspace_id);
CREATE INDEX idx_credit_rollover_expires ON credit_rollover_history(expires_at);

-- Função: Verificar limites do plano
CREATE OR REPLACE FUNCTION check_plan_limit(
  p_workspace_id UUID,
  p_limit_type TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription workspace_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO v_subscription
  FROM workspace_subscriptions
  WHERE workspace_id = p_workspace_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('allowed', false, 'error', 'no_active_subscription');
  END IF;
  
  CASE p_limit_type
    WHEN 'projects' THEN
      IF v_subscription.current_max_projects IS NULL THEN
        RETURN json_build_object('allowed', true, 'unlimited', true);
      ELSIF v_subscription.projects_count >= v_subscription.current_max_projects THEN
        RETURN json_build_object(
          'allowed', false, 
          'current', v_subscription.projects_count,
          'limit', v_subscription.current_max_projects
        );
      ELSE
        RETURN json_build_object('allowed', true);
      END IF;
      
    WHEN 'copies' THEN
      IF v_subscription.current_max_copies IS NULL THEN
        RETURN json_build_object('allowed', true, 'unlimited', true);
      ELSIF v_subscription.copies_count >= v_subscription.current_max_copies THEN
        RETURN json_build_object(
          'allowed', false,
          'current', v_subscription.copies_count,
          'limit', v_subscription.current_max_copies
        );
      ELSE
        RETURN json_build_object('allowed', true);
      END IF;
      
    WHEN 'copy_ai' THEN
      RETURN json_build_object('allowed', v_subscription.current_copy_ai_enabled);
      
    ELSE
      RETURN json_build_object('allowed', false, 'error', 'invalid_limit_type');
  END CASE;
END;
$$;

-- Função: Processar rollover de créditos
CREATE OR REPLACE FUNCTION process_credit_rollover(p_workspace_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription workspace_subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_credits workspace_credits%ROWTYPE;
  v_unused_credits NUMERIC;
  v_rolled_credits NUMERIC;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_subscription
  FROM workspace_subscriptions
  WHERE workspace_id = p_workspace_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'no_subscription');
  END IF;
  
  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_subscription.plan_id;
  
  IF NOT v_plan.rollover_enabled THEN
    RETURN json_build_object('success', false, 'error', 'rollover_not_enabled');
  END IF;
  
  SELECT * INTO v_credits FROM workspace_credits WHERE workspace_id = p_workspace_id;
  
  v_unused_credits := v_credits.balance;
  v_rolled_credits := v_unused_credits * (v_plan.rollover_percentage / 100);
  v_expires_at := NOW() + (v_plan.rollover_days || ' days')::INTERVAL;
  
  INSERT INTO credit_rollover_history (
    workspace_id, subscription_id, original_credits, 
    rolled_credits, rollover_percentage, expires_at
  ) VALUES (
    p_workspace_id, v_subscription.id, v_unused_credits,
    v_rolled_credits, v_plan.rollover_percentage, v_expires_at
  );
  
  RETURN json_build_object(
    'success', true,
    'unused_credits', v_unused_credits,
    'rolled_credits', v_rolled_credits,
    'expires_at', v_expires_at
  );
END;
$$;

-- Trigger: Atualizar contadores de projetos
CREATE OR REPLACE FUNCTION update_projects_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workspace_subscriptions
    SET projects_count = projects_count + 1
    WHERE workspace_id = NEW.workspace_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workspace_subscriptions
    SET projects_count = GREATEST(0, projects_count - 1)
    WHERE workspace_id = OLD.workspace_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_projects_count
AFTER INSERT OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION update_projects_count();

-- Trigger: Atualizar contadores de copies
CREATE OR REPLACE FUNCTION update_copies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE workspace_subscriptions
    SET copies_count = copies_count + 1
    WHERE workspace_id = NEW.workspace_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE workspace_subscriptions
    SET copies_count = GREATEST(0, copies_count - 1)
    WHERE workspace_id = OLD.workspace_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_copies_count
AFTER INSERT OR DELETE ON copies
FOR EACH ROW EXECUTE FUNCTION update_copies_count();

-- Trigger: Criar assinatura free ao criar workspace
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan subscription_plans%ROWTYPE;
BEGIN
  SELECT * INTO v_free_plan FROM subscription_plans WHERE slug = 'free' AND is_active = true;
  
  IF FOUND THEN
    INSERT INTO workspace_subscriptions (
      workspace_id, plan_id, billing_cycle, status,
      current_max_projects, current_max_copies, current_copy_ai_enabled
    ) VALUES (
      NEW.id, v_free_plan.id, 'free', 'active',
      v_free_plan.max_projects, v_free_plan.max_copies, v_free_plan.copy_ai_enabled
    );
    
    UPDATE workspace_credits
    SET balance = v_free_plan.credits_per_month,
        total_added = v_free_plan.credits_per_month
    WHERE workspace_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_default_subscription
AFTER INSERT ON workspaces
FOR EACH ROW EXECUTE FUNCTION create_default_subscription();

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_subscriptions_updated_at
BEFORE UPDATE ON workspace_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_rollover_history ENABLE ROW LEVEL SECURITY;

-- Policies para subscription_plans
CREATE POLICY "Super admins can manage plans"
ON subscription_plans FOR ALL
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'))
WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Everyone can view active plans"
ON subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);

-- Policies para workspace_subscriptions
CREATE POLICY "Workspace members can view their subscription"
ON workspace_subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = workspace_subscriptions.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can view all subscriptions"
ON workspace_subscriptions FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage subscriptions"
ON workspace_subscriptions FOR ALL
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'))
WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

-- Policies para credit_rollover_history
CREATE POLICY "Workspace members can view their rollover history"
ON credit_rollover_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = credit_rollover_history.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Inserir planos iniciais
INSERT INTO subscription_plans (name, slug, monthly_price, annual_price, max_projects, max_copies, copy_ai_enabled, credits_per_month, display_order) VALUES
('Free', 'free', 0, 0, 1, 5, false, 50, 1),
('Starter', 'starter', 97, 970, 1, NULL, false, 100, 2),
('Pro', 'pro', 297, 2970, 3, NULL, true, 300, 3),
('Business', 'business', 597, 5970, NULL, NULL, true, 1000, 4);