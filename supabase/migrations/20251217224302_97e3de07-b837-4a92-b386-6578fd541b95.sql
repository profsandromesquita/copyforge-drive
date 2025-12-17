
-- ============================================================
-- FASE 1: POLÍTICAS RLS PÚBLICAS NAS TABELAS BASE
-- ============================================================

-- 1.1 copies: Permitir visualização de copies públicas (para discover_cards e public_copies)
CREATE POLICY "PUBLIC: Anyone can view public copies"
ON public.copies FOR SELECT
TO anon, authenticated
USING (is_public = true OR show_in_discover = true);

-- 1.2 plan_offers: Permitir visualização de ofertas ativas (para public_plan_offers)
CREATE POLICY "PUBLIC: Anyone can view active plan offers"
ON public.plan_offers FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 1.3 system_settings: Permitir leitura de configurações públicas (para public_system_settings)
CREATE POLICY "PUBLIC: Anyone can view public system settings"
ON public.system_settings FOR SELECT
TO anon, authenticated
USING (true);

-- 1.4 workspace_subscriptions: Permitir membros verem seu plano (para public_workspace_plan_summary)
CREATE POLICY "Workspace members can view their subscription summary"
ON public.workspace_subscriptions FOR SELECT
TO authenticated
USING (is_workspace_member(auth.uid(), workspace_id));

-- 1.5 profiles: Permitir visualização de perfis em workspaces compartilhados (para basic_profiles via JOINs)
-- Nota: Já existe política "Users can only view own profile", mas precisamos expandir para membros de workspaces compartilhados
CREATE POLICY "Users can view profiles in shared workspaces"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR has_system_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM workspace_members wm1
    JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
  )
);

-- ============================================================
-- FASE 2: RECRIAR VIEWS COM security_invoker = true
-- ============================================================

-- 2.1 basic_profiles
DROP VIEW IF EXISTS public.basic_profiles CASCADE;
CREATE VIEW public.basic_profiles
WITH (security_invoker = true)
AS SELECT 
    id,
    name,
    email,
    avatar_url,
    created_at
FROM profiles;

-- 2.2 discover_cards
DROP VIEW IF EXISTS public.discover_cards CASCADE;
CREATE VIEW public.discover_cards
WITH (security_invoker = true)
AS SELECT 
    c.id,
    c.title,
    c.copy_type,
    c.copy_count,
    c.likes_count,
    c.created_by,
    c.created_at,
    TRIM(BOTH '"' FROM (jsonb_path_query_first(c.sessions, '$[*]."blocks"[*]?(@."type" == "image")."config"."imageUrl"'))::text) AS preview_image_url,
    LEFT(TRIM(BOTH '"' FROM (jsonb_path_query_first(c.sessions, '$[*]."blocks"[*]?(@."type" == "text" || @."type" == "headline")."content"'))::text), 150) AS preview_text,
    p.name AS creator_name,
    p.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.show_in_discover = true;

-- 2.3 drive_cards (depende de basic_profiles que foi recriada)
DROP VIEW IF EXISTS public.drive_cards CASCADE;
CREATE VIEW public.drive_cards
WITH (security_invoker = true)
AS SELECT 
    c.id,
    c.title,
    c.copy_type,
    c.status,
    c.folder_id,
    c.project_id,
    c.workspace_id,
    c.created_by,
    c.created_at,
    c.updated_at,
    TRIM(BOTH '"' FROM (jsonb_path_query_first(c.sessions, '$[*]."blocks"[*]?(@."type" == "image")."config"."imageUrl"'))::text) AS preview_image_url,
    LEFT(TRIM(BOTH '"' FROM (jsonb_path_query_first(c.sessions, '$[*]."blocks"[*]?(@."type" == "text" || @."type" == "headline")."content"'))::text), 150) AS preview_text,
    bp.name AS creator_name,
    bp.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN basic_profiles bp ON c.created_by = bp.id
WHERE c.is_template = false;

-- 2.4 public_copies
DROP VIEW IF EXISTS public.public_copies CASCADE;
CREATE VIEW public.public_copies
WITH (security_invoker = true)
AS SELECT 
    c.id,
    c.title,
    c.sessions,
    c.copy_type,
    c.copy_count,
    c.likes_count,
    c.created_by,
    c.created_at,
    c.is_public,
    c.show_in_discover,
    c.public_password,
    p.name AS creator_name,
    p.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN profiles p ON c.created_by = p.id
WHERE c.is_public = true;

-- 2.5 public_plan_offers
DROP VIEW IF EXISTS public.public_plan_offers CASCADE;
CREATE VIEW public.public_plan_offers
WITH (security_invoker = true)
AS SELECT 
    id,
    plan_id,
    name,
    price,
    billing_period_value,
    billing_period_unit,
    display_order,
    checkout_url,
    is_active
FROM plan_offers
WHERE is_active = true;

-- 2.6 public_system_settings
DROP VIEW IF EXISTS public.public_system_settings CASCADE;
CREATE VIEW public.public_system_settings
WITH (security_invoker = true)
AS SELECT 
    disable_signup,
    maintenance_mode
FROM system_settings
LIMIT 1;

-- 2.7 public_workspace_plan_summary
DROP VIEW IF EXISTS public.public_workspace_plan_summary CASCADE;
CREATE VIEW public.public_workspace_plan_summary
WITH (security_invoker = true)
AS SELECT 
    ws.workspace_id,
    sp.name AS plan_name,
    sp.slug AS plan_slug,
    ws.projects_count,
    ws.copies_count,
    ws.current_max_projects,
    ws.current_max_copies,
    ws.current_copy_ai_enabled,
    sp.credits_per_month
FROM workspace_subscriptions ws
JOIN subscription_plans sp ON ws.plan_id = sp.id
WHERE ws.status = 'active';

-- 2.8 templates_cards
DROP VIEW IF EXISTS public.templates_cards CASCADE;
CREATE VIEW public.templates_cards
WITH (security_invoker = true)
AS SELECT 
    c.id,
    c.title,
    c.copy_type,
    c.folder_id,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.workspace_id,
    TRIM(BOTH '"' FROM (jsonb_path_query_first(c.sessions, '$[*]."blocks"[*]?(@."type" == "image")."config"."imageUrl"'))::text) AS preview_image_url,
    TRIM(BOTH '"' FROM LEFT((jsonb_path_query_first(c.sessions, '$[*]."blocks"[*]?(@."type" == "text" || @."type" == "headline")."content"'))::text, 150)) AS preview_text,
    jsonb_array_length(c.sessions) AS sessions_count,
    (SELECT COALESCE(SUM(jsonb_array_length(session.value -> 'blocks')), 0)::integer
     FROM jsonb_array_elements(c.sessions) session(value)) AS blocks_count,
    bp.name AS creator_name,
    bp.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN basic_profiles bp ON c.created_by = bp.id
WHERE c.is_template = true;
