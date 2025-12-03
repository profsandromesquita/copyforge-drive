-- =============================================
-- FASE 3: SEGURANÇA DE DADOS (RLS Fix)
-- Correção de políticas permissivas e habilitação de RLS
-- =============================================

-- =============================================
-- 3.1 - HABILITAR RLS EM model_routing_history
-- =============================================

-- Habilitar RLS (estava desabilitado - VULNERABILIDADE CRÍTICA)
ALTER TABLE model_routing_history ENABLE ROW LEVEL SECURITY;

-- Apenas super admins podem visualizar histórico de roteamento
CREATE POLICY "Super admins can view routing history"
  ON model_routing_history FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));

-- Apenas super admins podem inserir (sistema via trigger)
CREATE POLICY "Super admins can insert routing history"
  ON model_routing_history FOR INSERT
  WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

-- =============================================
-- 3.2 - CORRIGIR POLICY DE profiles (vazamento de PII)
-- =============================================

-- REMOVER policy permissiva que expõe todos os perfis publicamente
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON profiles;

-- NOVA policy: Usuários só podem ver perfis de membros dos mesmos workspaces
-- Usa subquery otimizada para evitar recursão infinita
CREATE POLICY "Users can view profiles in shared workspaces"
  ON profiles FOR SELECT
  USING (
    -- Sempre pode ver o próprio perfil
    auth.uid() = id
    -- Ou é super admin
    OR has_system_role(auth.uid(), 'super_admin')
    -- Ou compartilha pelo menos um workspace
    OR EXISTS (
      SELECT 1 
      FROM workspace_members wm1
      INNER JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
        AND wm2.user_id = profiles.id
    )
  );

-- =============================================
-- 3.3 - CORRIGIR POLICY DE workspace_credits (fraude financeira)
-- =============================================

-- REMOVER policy permissiva que permite UPDATE de qualquer usuário autenticado
DROP POLICY IF EXISTS "Functions can update workspace credits" ON workspace_credits;

-- Nota: A policy "Super admins can update workspace credits" permanece.
-- Updates de créditos agora só podem ser feitos via:
-- 1. Super admins diretamente
-- 2. Edge functions usando service_role_key (bypassa RLS)

-- =============================================
-- 3.4 - CORRIGIR POLICY DE credit_transactions (inserção arbitrária)
-- =============================================

-- REMOVER policy permissiva que permite INSERT de qualquer usuário
DROP POLICY IF EXISTS "System can insert transactions" ON credit_transactions;

-- Nota: Transações de crédito agora só podem ser inseridas via:
-- 1. Edge functions usando service_role_key (bypassa RLS)
-- 2. Database functions com SECURITY DEFINER
-- Usuários autenticados NÃO podem inserir diretamente