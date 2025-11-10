-- ============================================
-- FASE 1: Criar nova estrutura de ofertas
-- ============================================

-- Criar tabela de ofertas de planos
CREATE TABLE IF NOT EXISTS public.plan_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  payment_gateway_id UUID NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  
  -- Configuração da oferta
  name VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  billing_period_value INTEGER NOT NULL CHECK (billing_period_value > 0),
  billing_period_unit VARCHAR(20) NOT NULL CHECK (billing_period_unit IN ('days', 'months', 'years', 'lifetime')),
  
  -- Integração com gateway
  gateway_offer_id VARCHAR(255) NOT NULL,
  checkout_url TEXT NOT NULL,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plan_id, payment_gateway_id, gateway_offer_id)
);

-- Criar índices para performance
CREATE INDEX idx_plan_offers_plan_id ON public.plan_offers(plan_id);
CREATE INDEX idx_plan_offers_gateway_id ON public.plan_offers(payment_gateway_id);
CREATE INDEX idx_plan_offers_active ON public.plan_offers(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE public.plan_offers ENABLE ROW LEVEL SECURITY;

-- Policies: Super admins podem gerenciar ofertas
CREATE POLICY "Super admins can manage plan offers"
ON public.plan_offers
FOR ALL
USING (has_system_role(auth.uid(), 'super_admin'))
WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

-- Policies: Usuários podem ver ofertas ativas
CREATE POLICY "Users can view active plan offers"
ON public.plan_offers
FOR SELECT
USING (is_active = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_plan_offers_updated_at
BEFORE UPDATE ON public.plan_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FASE 2: Migrar dados existentes
-- ============================================

-- Adicionar flag temporária para compatibilidade
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS uses_legacy_pricing BOOLEAN DEFAULT true;

-- Migrar ofertas mensais existentes
INSERT INTO public.plan_offers (
  plan_id,
  payment_gateway_id,
  name,
  price,
  billing_period_value,
  billing_period_unit,
  gateway_offer_id,
  checkout_url,
  is_active,
  display_order
)
SELECT 
  sp.id as plan_id,
  sp.payment_gateway_id,
  'Mensal' as name,
  sp.monthly_price as price,
  1 as billing_period_value,
  'months' as billing_period_unit,
  'legacy_monthly_' || sp.id as gateway_offer_id,
  COALESCE(sp.checkout_url_monthly, '') as checkout_url,
  sp.is_active,
  1 as display_order
FROM public.subscription_plans sp
WHERE sp.payment_gateway_id IS NOT NULL
  AND sp.monthly_price > 0
ON CONFLICT (plan_id, payment_gateway_id, gateway_offer_id) DO NOTHING;

-- Migrar ofertas anuais existentes
INSERT INTO public.plan_offers (
  plan_id,
  payment_gateway_id,
  name,
  price,
  billing_period_value,
  billing_period_unit,
  gateway_offer_id,
  checkout_url,
  is_active,
  display_order
)
SELECT 
  sp.id as plan_id,
  sp.payment_gateway_id,
  'Anual' as name,
  sp.annual_price as price,
  12 as billing_period_value,
  'months' as billing_period_unit,
  'legacy_annual_' || sp.id as gateway_offer_id,
  COALESCE(sp.checkout_url_annual, '') as checkout_url,
  sp.is_active,
  2 as display_order
FROM public.subscription_plans sp
WHERE sp.payment_gateway_id IS NOT NULL
  AND sp.annual_price > 0
ON CONFLICT (plan_id, payment_gateway_id, gateway_offer_id) DO NOTHING;

-- ============================================
-- FASE 3: Adicionar referência em subscriptions
-- ============================================

-- Adicionar coluna para rastrear oferta específica
ALTER TABLE public.workspace_subscriptions 
ADD COLUMN IF NOT EXISTS plan_offer_id UUID REFERENCES public.plan_offers(id);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_workspace_subscriptions_offer_id 
ON public.workspace_subscriptions(plan_offer_id);

-- ============================================
-- FASE 4: Funções auxiliares
-- ============================================

-- Função para validar se plano tem pelo menos uma oferta ativa
CREATE OR REPLACE FUNCTION public.validate_plan_has_active_offers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false THEN
    -- Verificar se é a última oferta ativa do plano
    IF NOT EXISTS (
      SELECT 1 FROM public.plan_offers
      WHERE plan_id = NEW.plan_id 
        AND is_active = true 
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Não é possível desativar a última oferta ativa do plano';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para validar ofertas ativas
CREATE TRIGGER validate_active_offers_before_update
BEFORE UPDATE ON public.plan_offers
FOR EACH ROW
WHEN (OLD.is_active = true AND NEW.is_active = false)
EXECUTE FUNCTION public.validate_plan_has_active_offers();

-- Função para impedir deletar oferta em uso
CREATE OR REPLACE FUNCTION public.prevent_delete_offer_in_use()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.workspace_subscriptions
    WHERE plan_offer_id = OLD.id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Não é possível deletar uma oferta que está em uso por subscriptions ativas';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para prevenir deleção
CREATE TRIGGER prevent_delete_offer_in_use_trigger
BEFORE DELETE ON public.plan_offers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_offer_in_use();