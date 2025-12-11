-- =============================================
-- FASE 1: Criar VIEWs Seguras para Acesso Público
-- =============================================

-- VIEW: public_plan_offers
-- Expõe apenas campos públicos, oculta payment_gateway_id e gateway_offer_id
CREATE OR REPLACE VIEW public.public_plan_offers AS
SELECT 
  id,
  plan_id,
  name,
  price,
  billing_period_value,
  billing_period_unit,
  display_order,
  checkout_url,
  is_active
FROM public.plan_offers
WHERE is_active = true;

-- Permitir acesso anônimo e autenticado à VIEW
GRANT SELECT ON public.public_plan_offers TO anon;
GRANT SELECT ON public.public_plan_offers TO authenticated;

-- VIEW: public_system_settings
-- Expõe apenas disable_signup e maintenance_mode
CREATE OR REPLACE VIEW public.public_system_settings AS
SELECT 
  disable_signup,
  maintenance_mode
FROM public.system_settings
LIMIT 1;

-- Permitir acesso anônimo e autenticado à VIEW
GRANT SELECT ON public.public_system_settings TO anon;
GRANT SELECT ON public.public_system_settings TO authenticated;

-- =============================================
-- FASE 2: RPC Functions para Convites (SECURITY DEFINER)
-- =============================================

-- Function: validate_invite_token
-- Valida convite sem expor a tabela workspace_invitations
-- Permite acesso anônimo (necessário para fluxo de signup)
CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_workspace RECORD;
  v_inviter RECORD;
BEGIN
  -- Buscar convite pelo token específico
  SELECT * INTO v_invite
  FROM workspace_invitations
  WHERE token = p_token
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invite_not_found');
  END IF;
  
  -- Verificar expiração
  IF v_invite.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'invite_expired');
  END IF;
  
  -- Buscar dados do workspace (apenas nome e avatar)
  SELECT name, avatar_url INTO v_workspace
  FROM workspaces WHERE id = v_invite.workspace_id;
  
  -- Buscar nome do convidador
  SELECT name INTO v_inviter
  FROM profiles WHERE id = v_invite.invited_by;
  
  -- Retornar apenas dados necessários (sem IDs sensíveis)
  RETURN json_build_object(
    'success', true,
    'email', v_invite.email,
    'role', v_invite.role,
    'workspace_name', v_workspace.name,
    'workspace_avatar', v_workspace.avatar_url,
    'inviter_name', v_inviter.name,
    'expires_at', v_invite.expires_at
  );
END;
$$;

-- Permitir execução anônima (necessário para SignupInvite.tsx)
GRANT EXECUTE ON FUNCTION public.validate_invite_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invite_token(UUID) TO authenticated;

-- Function: accept_invite_by_token
-- Processa aceite do convite de forma segura
-- Requer usuário autenticado
CREATE OR REPLACE FUNCTION public.accept_invite_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  -- Usuário deve estar autenticado
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  
  -- Buscar email do usuário
  SELECT email INTO v_user_email FROM profiles WHERE id = auth.uid();
  
  -- Buscar convite
  SELECT * INTO v_invite
  FROM workspace_invitations
  WHERE token = p_token AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invite_not_found');
  END IF;
  
  -- Verificar se email confere
  IF v_invite.email != v_user_email THEN
    RETURN json_build_object('success', false, 'error', 'email_mismatch');
  END IF;
  
  -- Verificar expiração
  IF v_invite.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'invite_expired');
  END IF;
  
  -- Verificar se já é membro
  IF EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = v_invite.workspace_id AND user_id = auth.uid()
  ) THEN
    -- Já é membro, apenas marcar convite como aceito
    UPDATE workspace_invitations SET status = 'accepted' WHERE token = p_token;
    RETURN json_build_object(
      'success', true,
      'workspace_id', v_invite.workspace_id,
      'already_member', true
    );
  END IF;
  
  -- Adicionar membro ao workspace
  INSERT INTO workspace_members (workspace_id, user_id, role, invited_by)
  VALUES (v_invite.workspace_id, auth.uid(), v_invite.role, v_invite.invited_by);
  
  -- Marcar convite como aceito
  UPDATE workspace_invitations SET status = 'accepted' WHERE token = p_token;
  
  RETURN json_build_object(
    'success', true,
    'workspace_id', v_invite.workspace_id,
    'already_member', false
  );
END;
$$;

-- Apenas usuários autenticados podem aceitar
GRANT EXECUTE ON FUNCTION public.accept_invite_by_token(UUID) TO authenticated;

-- Function: decline_invite_by_token
-- Permite recusar convite de forma segura
CREATE OR REPLACE FUNCTION public.decline_invite_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  -- Usuário deve estar autenticado
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  
  -- Buscar email do usuário
  SELECT email INTO v_user_email FROM profiles WHERE id = auth.uid();
  
  -- Buscar convite
  SELECT * INTO v_invite
  FROM workspace_invitations
  WHERE token = p_token AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'invite_not_found');
  END IF;
  
  -- Verificar se email confere
  IF v_invite.email != v_user_email THEN
    RETURN json_build_object('success', false, 'error', 'email_mismatch');
  END IF;
  
  -- Marcar convite como recusado
  UPDATE workspace_invitations SET status = 'declined' WHERE token = p_token;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Apenas usuários autenticados podem recusar
GRANT EXECUTE ON FUNCTION public.decline_invite_by_token(UUID) TO authenticated;