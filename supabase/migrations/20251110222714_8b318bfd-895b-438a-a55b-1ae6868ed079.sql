-- Adicionar campos separados para URLs de checkout mensal e anual
ALTER TABLE public.subscription_plans 
  ADD COLUMN checkout_url_monthly TEXT,
  ADD COLUMN checkout_url_annual TEXT;

-- Migrar dados existentes do campo antigo para os novos (se houver)
UPDATE public.subscription_plans 
SET 
  checkout_url_monthly = checkout_url,
  checkout_url_annual = checkout_url
WHERE checkout_url IS NOT NULL AND checkout_url != '';

-- Remover campo antigo
ALTER TABLE public.subscription_plans 
  DROP COLUMN checkout_url;