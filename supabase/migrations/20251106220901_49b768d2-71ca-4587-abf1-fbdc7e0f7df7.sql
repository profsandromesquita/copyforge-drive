-- Migration 001: Criar tipos enum e tabelas de configuração de créditos

-- Tabela de configuração global
CREATE TABLE IF NOT EXISTS public.credit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_limit_pct numeric NOT NULL DEFAULT 25,
  base_tpc_gemini numeric NOT NULL DEFAULT 10000,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Inserir configuração padrão
INSERT INTO public.credit_config (cost_limit_pct, base_tpc_gemini)
VALUES (25, 10000);

-- Tabela de multiplicadores por modelo
CREATE TABLE IF NOT EXISTS public.model_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.0,
  is_baseline boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir modelos iniciais
INSERT INTO public.model_multipliers (model_name, display_name, multiplier, is_baseline) VALUES
('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 1.0, true),
('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 1.0, true),
('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 1.0, true),
('google/gemini-2.5-flash-image-preview', 'Gemini 2.5 Flash Image', 1.0, true),
('openai/gpt-5', 'GPT-5', 2.0, false),
('openai/gpt-5-mini', 'GPT-5 Mini', 2.0, false),
('openai/gpt-5-nano', 'GPT-5 Nano', 2.0, false);

-- Tabela de saldo de créditos por workspace
CREATE TABLE IF NOT EXISTS public.workspace_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid UNIQUE NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  balance numeric(10,2) NOT NULL DEFAULT 0,
  total_added numeric(10,2) NOT NULL DEFAULT 0,
  total_used numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Dar 100 créditos iniciais para cada workspace existente
INSERT INTO public.workspace_credits (workspace_id, balance, total_added)
SELECT id, 100.0, 100.0 FROM public.workspaces
ON CONFLICT (workspace_id) DO NOTHING;

-- Trigger para criar créditos automaticamente quando um workspace é criado
CREATE OR REPLACE FUNCTION public.create_workspace_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_credits (workspace_id, balance, total_added)
  VALUES (NEW.id, 100.0, 100.0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_workspace_created_credits
  AFTER INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.create_workspace_credits();

-- Tabela de transações de créditos
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('debit', 'credit', 'adjustment')),
  amount numeric(10,4) NOT NULL,
  balance_before numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  model_used text,
  tokens_used integer,
  input_tokens integer,
  output_tokens integer,
  tpc_snapshot numeric,
  multiplier_snapshot numeric,
  cost_limit_snapshot numeric,
  generation_id uuid REFERENCES public.ai_generation_history(id),
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_credit_transactions_workspace ON public.credit_transactions(workspace_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Tabela de histórico de mudanças nos parâmetros
CREATE TABLE IF NOT EXISTS public.credit_config_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_limit_pct_old numeric NOT NULL,
  cost_limit_pct_new numeric NOT NULL,
  changed_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Atualizar ai_generation_history para incluir informações de créditos
ALTER TABLE public.ai_generation_history 
ADD COLUMN IF NOT EXISTS credits_debited numeric(10,4),
ADD COLUMN IF NOT EXISTS tpc_snapshot numeric,
ADD COLUMN IF NOT EXISTS multiplier_snapshot numeric;

-- Enable RLS
ALTER TABLE public.credit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_config_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies para credit_config
CREATE POLICY "Super admins can view credit config"
  ON public.credit_config FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update credit config"
  ON public.credit_config FOR UPDATE
  USING (has_system_role(auth.uid(), 'super_admin'));

-- RLS Policies para model_multipliers
CREATE POLICY "Super admins can view model multipliers"
  ON public.model_multipliers FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update model multipliers"
  ON public.model_multipliers FOR UPDATE
  USING (has_system_role(auth.uid(), 'super_admin'));

-- RLS Policies para workspace_credits
CREATE POLICY "Workspace members can view their credits"
  ON public.workspace_credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = workspace_credits.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all workspace credits"
  ON public.workspace_credits FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update workspace credits"
  ON public.workspace_credits FOR UPDATE
  USING (has_system_role(auth.uid(), 'super_admin'));

-- RLS Policies para credit_transactions
CREATE POLICY "Workspace members can view their transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_members.workspace_id = credit_transactions.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies para credit_config_history
CREATE POLICY "Super admins can view config history"
  ON public.credit_config_history FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));