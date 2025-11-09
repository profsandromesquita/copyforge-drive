-- Desabilitar triggers que criam subscription
ALTER TABLE workspaces DISABLE TRIGGER trigger_create_default_subscription;
ALTER TABLE workspaces DISABLE TRIGGER assign_plan_on_workspace_create;

-- Criar workspace para Pedro Jose manualmente
DO $$
DECLARE
  v_workspace_id UUID;
  v_plan_id UUID;
BEGIN
  -- Criar workspace
  INSERT INTO workspaces (name, created_by)
  VALUES ('Meu Workspace', 'ba980d70-4829-4fbd-9005-ca8a5d2ffbee')
  RETURNING id INTO v_workspace_id;
  
  -- Adicionar membership
  INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (v_workspace_id, 'ba980d70-4829-4fbd-9005-ca8a5d2ffbee', 'owner', 'ba980d70-4829-4fbd-9005-ca8a5d2ffbee');
  
  -- Buscar plano free
  SELECT id INTO v_plan_id FROM subscription_plans WHERE slug = 'free' AND is_active = true LIMIT 1;
  
  -- Criar subscription manualmente com todos os campos necessários
  INSERT INTO workspace_subscriptions (
    workspace_id, 
    plan_id, 
    billing_cycle, 
    status,
    current_max_projects,
    current_max_copies,
    current_copy_ai_enabled
  )
  SELECT 
    v_workspace_id,
    sp.id,
    'free',
    'active',
    sp.max_projects,
    sp.max_copies,
    sp.copy_ai_enabled
  FROM subscription_plans sp
  WHERE sp.slug = 'free' AND sp.is_active = true
  LIMIT 1
  ON CONFLICT (workspace_id) DO NOTHING;
  
  -- Atualizar créditos do workspace
  UPDATE workspace_credits
  SET balance = (SELECT credits_per_month FROM subscription_plans WHERE slug = 'free' LIMIT 1),
      total_added = (SELECT credits_per_month FROM subscription_plans WHERE slug = 'free' LIMIT 1)
  WHERE workspace_id = v_workspace_id;
  
  RAISE NOTICE 'Workspace % created successfully for Pedro Jose', v_workspace_id;
END $$;

-- Reabilitar triggers
ALTER TABLE workspaces ENABLE TRIGGER trigger_create_default_subscription;
ALTER TABLE workspaces ENABLE TRIGGER assign_plan_on_workspace_create;