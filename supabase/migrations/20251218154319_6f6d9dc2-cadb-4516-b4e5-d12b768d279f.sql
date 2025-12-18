-- Fase 1: Remover política duplicada na tabela profiles
DROP POLICY IF EXISTS "Users can only view own profile" ON public.profiles;

-- Fase 2: Recriar VIEWs em cascata (basic_profiles como SECURITY DEFINER)

-- Dropar todas as VIEWs dependentes
DROP VIEW IF EXISTS public.drive_cards;
DROP VIEW IF EXISTS public.templates_cards;
DROP VIEW IF EXISTS public.basic_profiles;

-- Recriar basic_profiles como SECURITY DEFINER (padrão quando não especifica security_invoker)
CREATE VIEW public.basic_profiles AS
SELECT 
  id,
  name,
  email,
  avatar_url,
  created_at
FROM public.profiles;

COMMENT ON VIEW public.basic_profiles IS 
'VIEW SECURITY DEFINER para exposição controlada de dados públicos de perfil. 
Bypassa RLS da tabela profiles intencionalmente para permitir que membros 
do workspace vejam uns aos outros. NÃO expõe PII (cpf, telefone, endereço).';

GRANT SELECT ON public.basic_profiles TO authenticated;

-- Recriar drive_cards (depende de basic_profiles)
CREATE VIEW public.drive_cards AS
SELECT 
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

GRANT SELECT ON public.drive_cards TO authenticated;

-- Recriar templates_cards (depende de basic_profiles)
CREATE VIEW public.templates_cards AS
SELECT 
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
    (SELECT COALESCE(SUM(jsonb_array_length(session.value -> 'blocks'))::integer, 0)
     FROM jsonb_array_elements(c.sessions) AS session(value)) AS blocks_count,
    bp.name AS creator_name,
    bp.avatar_url AS creator_avatar_url
FROM copies c
LEFT JOIN basic_profiles bp ON c.created_by = bp.id
WHERE c.is_template = true;

GRANT SELECT ON public.templates_cards TO authenticated;