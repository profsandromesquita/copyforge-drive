-- Função para sincronizar limites de workspace com o plano
CREATE OR REPLACE FUNCTION sync_workspace_plan_limits(p_workspace_id UUID DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_workspace RECORD;
BEGIN
  FOR v_workspace IN 
    SELECT ws.id, ws.plan_id, sp.max_projects, sp.max_copies, sp.copy_ai_enabled
    FROM workspace_subscriptions ws
    JOIN subscription_plans sp ON ws.plan_id = sp.id
    WHERE ws.status = 'active'
      AND (p_workspace_id IS NULL OR ws.workspace_id = p_workspace_id)
      AND (
        ws.current_max_projects IS DISTINCT FROM sp.max_projects
        OR ws.current_max_copies IS DISTINCT FROM sp.max_copies
        OR ws.current_copy_ai_enabled IS DISTINCT FROM sp.copy_ai_enabled
      )
  LOOP
    UPDATE workspace_subscriptions
    SET 
      current_max_projects = v_workspace.max_projects,
      current_max_copies = v_workspace.max_copies,
      current_copy_ai_enabled = v_workspace.copy_ai_enabled,
      updated_at = NOW()
    WHERE id = v_workspace.id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
END;
$$;

-- Trigger para sincronizar automaticamente quando um plano é atualizado
CREATE OR REPLACE FUNCTION sync_plan_limits_on_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF (OLD.max_projects IS DISTINCT FROM NEW.max_projects
      OR OLD.max_copies IS DISTINCT FROM NEW.max_copies
      OR OLD.copy_ai_enabled IS DISTINCT FROM NEW.copy_ai_enabled) THEN
    
    UPDATE workspace_subscriptions
    SET 
      current_max_projects = NEW.max_projects,
      current_max_copies = NEW.max_copies,
      current_copy_ai_enabled = NEW.copy_ai_enabled,
      updated_at = NOW()
    WHERE plan_id = NEW.id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_sync_plan_limits
AFTER UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION sync_plan_limits_on_update();

-- Função RPC para super admin forçar sincronização
CREATE OR REPLACE FUNCTION admin_sync_all_workspace_limits()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT has_system_role(auth.uid(), 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  
  RETURN sync_workspace_plan_limits(NULL);
END;
$$;

-- Correção imediata: sincronizar todos os workspaces existentes
SELECT sync_workspace_plan_limits(NULL);