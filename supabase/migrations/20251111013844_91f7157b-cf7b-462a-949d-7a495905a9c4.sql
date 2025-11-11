-- Adicionar campo is_active na tabela workspaces
ALTER TABLE public.workspaces 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para otimizar consultas
CREATE INDEX idx_workspaces_is_active ON public.workspaces(is_active);

-- Atualizar função can_create_free_workspace para considerar apenas workspaces ativos
CREATE OR REPLACE FUNCTION public.can_create_free_workspace(_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_max_free_workspaces integer;
  v_current_free_workspaces integer;
BEGIN
  -- Get the configured limit
  SELECT max_free_workspaces_per_user INTO v_max_free_workspaces
  FROM system_settings
  LIMIT 1;
  
  -- Count user's current ACTIVE free workspaces (where they are owner)
  SELECT COUNT(*) INTO v_current_free_workspaces
  FROM workspaces w
  JOIN workspace_members wm ON w.id = wm.workspace_id
  JOIN workspace_subscriptions ws ON w.id = ws.workspace_id
  JOIN subscription_plans sp ON ws.plan_id = sp.id
  WHERE wm.user_id = _user_id
    AND wm.role = 'owner'
    AND ws.status = 'active'
    AND sp.slug = 'free'
    AND w.is_active = true;
  
  RETURN json_build_object(
    'can_create', v_current_free_workspaces < v_max_free_workspaces,
    'current_count', v_current_free_workspaces,
    'max_allowed', v_max_free_workspaces
  );
END;
$function$;

-- Criar função para ativar workspace após pagamento
CREATE OR REPLACE FUNCTION public.activate_workspace_after_payment(p_workspace_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se workspace existe e está inativo
  IF NOT EXISTS (SELECT 1 FROM workspaces WHERE id = p_workspace_id AND is_active = false) THEN
    RETURN json_build_object('success', false, 'error', 'workspace_not_found_or_already_active');
  END IF;
  
  -- Ativar workspace
  UPDATE workspaces
  SET is_active = true
  WHERE id = p_workspace_id;
  
  RETURN json_build_object('success', true, 'message', 'Workspace ativado com sucesso');
END;
$function$;

-- Atualizar políticas RLS para considerar is_active
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;
CREATE POLICY "Users can view their workspaces"
ON public.workspaces
FOR SELECT
USING (
  (is_workspace_member(auth.uid(), id) OR (auth.uid() = created_by))
);

-- Comentário: Workspaces inativos aparecem mas não podem ser selecionados como ativos no frontend