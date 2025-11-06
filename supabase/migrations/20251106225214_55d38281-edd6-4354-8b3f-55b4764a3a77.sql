-- Fase 1: Corrigir Permissões RLS para Sistema de Créditos

-- Permitir que funções SECURITY DEFINER atualizem workspace_credits
CREATE POLICY "Functions can update workspace credits" 
ON public.workspace_credits 
FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

-- Garantir que as funções podem inserir transações de crédito
GRANT INSERT ON public.credit_transactions TO postgres, authenticated, service_role;
GRANT UPDATE ON public.workspace_credits TO postgres, authenticated, service_role;

-- Garantir que o sistema pode atualizar histórico de geração de IA
GRANT UPDATE ON public.ai_generation_history TO postgres, authenticated, service_role;