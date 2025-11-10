-- Add max_free_workspaces_per_user to system_settings
ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS max_free_workspaces_per_user integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.system_settings.max_free_workspaces_per_user IS 'Maximum number of free plan workspaces a user can create';

-- Create function to check if user can create free workspace
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
  
  -- Count user's current free workspaces (where they are owner)
  SELECT COUNT(*) INTO v_current_free_workspaces
  FROM workspaces w
  JOIN workspace_members wm ON w.id = wm.workspace_id
  JOIN workspace_subscriptions ws ON w.id = ws.workspace_id
  JOIN subscription_plans sp ON ws.plan_id = sp.id
  WHERE wm.user_id = _user_id
    AND wm.role = 'owner'
    AND ws.status = 'active'
    AND sp.slug = 'free';
  
  RETURN json_build_object(
    'can_create', v_current_free_workspaces < v_max_free_workspaces,
    'current_count', v_current_free_workspaces,
    'max_allowed', v_max_free_workspaces
  );
END;
$function$;