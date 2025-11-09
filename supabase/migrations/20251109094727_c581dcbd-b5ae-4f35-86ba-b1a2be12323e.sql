-- Atribuir plano Free para workspaces existentes sem assinatura
DO $$
DECLARE
  v_free_plan_id UUID;
  v_workspace RECORD;
  v_project_count INTEGER;
  v_copy_count INTEGER;
BEGIN
  -- Buscar ID do plano Free
  SELECT id INTO v_free_plan_id 
  FROM subscription_plans 
  WHERE slug = 'free' AND is_active = true;

  IF v_free_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plano Free não encontrado';
  END IF;

  -- Para cada workspace sem assinatura
  FOR v_workspace IN 
    SELECT w.id, w.name
    FROM workspaces w
    LEFT JOIN workspace_subscriptions ws ON w.id = ws.workspace_id
    WHERE ws.id IS NULL
  LOOP
    -- Contar projetos e copies do workspace
    SELECT COUNT(*) INTO v_project_count
    FROM projects
    WHERE workspace_id = v_workspace.id;

    SELECT COUNT(*) INTO v_copy_count
    FROM copies
    WHERE workspace_id = v_workspace.id AND is_template = false;

    -- Criar assinatura Free com contadores corretos
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
    )
    SELECT 
      v_workspace.id,
      v_free_plan_id,
      'free'::billing_cycle_type,
      'active'::subscription_status,
      sp.max_projects,
      sp.max_copies,
      sp.copy_ai_enabled,
      v_project_count,
      v_copy_count
    FROM subscription_plans sp
    WHERE sp.id = v_free_plan_id;

    -- Atualizar créditos do workspace (se ainda não tem)
    UPDATE workspace_credits
    SET 
      balance = 50.00,
      total_added = COALESCE(total_added, 0) + 50.00
    WHERE workspace_id = v_workspace.id
      AND balance = 0;

    RAISE NOTICE 'Workspace % (%): % projetos, % copies', 
      v_workspace.name, 
      v_workspace.id, 
      v_project_count, 
      v_copy_count;
  END LOOP;
END $$;