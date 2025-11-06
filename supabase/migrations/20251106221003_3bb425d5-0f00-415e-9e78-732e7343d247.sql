-- Migration 002: Criar funções SQL para cálculo de créditos

-- Função para calcular TPC do Gemini baseado no limite de custo
CREATE OR REPLACE FUNCTION public.calculate_tpc_gemini(cost_limit_pct numeric)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT base_tpc_gemini FROM public.credit_config ORDER BY updated_at DESC LIMIT 1) 
         * (cost_limit_pct / 25.0)
$$;

-- Função para calcular TPC de um modelo específico
CREATE OR REPLACE FUNCTION public.calculate_tpc_model(p_model_name text, cost_limit_pct numeric)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT calculate_tpc_gemini(cost_limit_pct) / 
         COALESCE((SELECT multiplier FROM public.model_multipliers WHERE model_name = p_model_name LIMIT 1), 1.0)
$$;

-- Função para calcular débito de créditos
CREATE OR REPLACE FUNCTION public.calculate_credit_debit(tokens_used integer, p_model_name text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_cost_limit numeric;
  tpc numeric;
BEGIN
  SELECT cost_limit_pct INTO current_cost_limit 
  FROM public.credit_config ORDER BY updated_at DESC LIMIT 1;
  
  tpc := calculate_tpc_model(p_model_name, current_cost_limit);
  
  RETURN tokens_used::numeric / NULLIF(tpc, 0);
END;
$$;

-- Função para verificar se tem créditos suficientes
CREATE OR REPLACE FUNCTION public.check_workspace_credits(
  p_workspace_id uuid,
  estimated_tokens integer DEFAULT 5000,
  p_model_name text DEFAULT 'google/gemini-2.5-flash'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric;
  estimated_debit numeric;
BEGIN
  SELECT balance INTO current_balance 
  FROM public.workspace_credits 
  WHERE workspace_id = p_workspace_id;
  
  IF current_balance IS NULL THEN
    RETURN json_build_object('has_sufficient_credits', false, 'error', 'workspace_not_found');
  END IF;
  
  estimated_debit := calculate_credit_debit(estimated_tokens, p_model_name);
  
  RETURN json_build_object(
    'has_sufficient_credits', current_balance >= estimated_debit,
    'current_balance', current_balance,
    'estimated_debit', estimated_debit
  );
END;
$$;

-- Função para debitar créditos do workspace
CREATE OR REPLACE FUNCTION public.debit_workspace_credits(
  p_workspace_id uuid,
  p_model_name text,
  tokens_used integer,
  p_input_tokens integer,
  p_output_tokens integer,
  generation_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  debit_amount numeric;
  current_balance numeric;
  new_balance numeric;
  current_tpc numeric;
  current_multiplier numeric;
  current_cost_limit numeric;
  effective_user_id uuid;
BEGIN
  -- Usar auth.uid() se user_id não for fornecido
  effective_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Obter parâmetros atuais
  SELECT cost_limit_pct INTO current_cost_limit 
  FROM public.credit_config 
  ORDER BY updated_at DESC 
  LIMIT 1;
  
  SELECT multiplier INTO current_multiplier 
  FROM public.model_multipliers 
  WHERE model_name = p_model_name 
  LIMIT 1;
  
  current_tpc := calculate_tpc_model(p_model_name, current_cost_limit);
  
  -- Calcular débito
  debit_amount := calculate_credit_debit(tokens_used, p_model_name);
  
  -- Obter saldo atual
  SELECT balance INTO current_balance 
  FROM public.workspace_credits 
  WHERE workspace_id = p_workspace_id;
  
  -- Verificar se tem saldo
  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'workspace_not_found');
  END IF;
  
  IF current_balance < debit_amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'insufficient_credits',
      'current_balance', current_balance,
      'required', debit_amount
    );
  END IF;
  
  new_balance := current_balance - debit_amount;
  
  -- Atualizar saldo
  UPDATE public.workspace_credits 
  SET balance = new_balance, 
      total_used = total_used + debit_amount,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;
  
  -- Registrar transação
  INSERT INTO public.credit_transactions (
    workspace_id, user_id, transaction_type, amount,
    balance_before, balance_after, model_used, tokens_used,
    input_tokens, output_tokens,
    tpc_snapshot, multiplier_snapshot, cost_limit_snapshot,
    generation_id
  ) VALUES (
    p_workspace_id, effective_user_id, 'debit', debit_amount,
    current_balance, new_balance, p_model_name, tokens_used,
    p_input_tokens, p_output_tokens,
    current_tpc, current_multiplier, current_cost_limit,
    generation_id
  );
  
  RETURN json_build_object(
    'success', true, 
    'balance', new_balance, 
    'debited', debit_amount,
    'tpc_snapshot', current_tpc,
    'multiplier_snapshot', current_multiplier
  );
END;
$$;

-- Função para adicionar créditos ao workspace (administrativo)
CREATE OR REPLACE FUNCTION public.add_workspace_credits(
  p_workspace_id uuid,
  amount numeric,
  description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
BEGIN
  -- Verificar se é super admin
  IF NOT has_system_role(auth.uid(), 'super_admin') THEN
    RETURN json_build_object('success', false, 'error', 'unauthorized');
  END IF;
  
  -- Obter saldo atual
  SELECT balance INTO current_balance 
  FROM public.workspace_credits 
  WHERE workspace_id = p_workspace_id;
  
  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'workspace_not_found');
  END IF;
  
  new_balance := current_balance + amount;
  
  -- Atualizar saldo
  UPDATE public.workspace_credits 
  SET balance = new_balance,
      total_added = total_added + amount,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;
  
  -- Registrar transação
  INSERT INTO public.credit_transactions (
    workspace_id, user_id, transaction_type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_workspace_id, auth.uid(), 'credit', amount,
    current_balance, new_balance, COALESCE(description, 'Créditos adicionados pelo admin')
  );
  
  RETURN json_build_object(
    'success', true,
    'balance', new_balance,
    'added', amount
  );
END;
$$;

-- Trigger para registrar mudanças nos parâmetros de crédito
CREATE OR REPLACE FUNCTION public.log_credit_config_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.cost_limit_pct != NEW.cost_limit_pct THEN
    INSERT INTO public.credit_config_history (
      cost_limit_pct_old,
      cost_limit_pct_new,
      changed_by
    ) VALUES (
      OLD.cost_limit_pct,
      NEW.cost_limit_pct,
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_credit_config_update
  BEFORE UPDATE ON public.credit_config
  FOR EACH ROW
  EXECUTE FUNCTION public.log_credit_config_change();