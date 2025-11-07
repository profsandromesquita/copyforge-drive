-- Add low credit threshold configuration to workspace_credits
ALTER TABLE public.workspace_credits 
ADD COLUMN IF NOT EXISTS low_credit_threshold numeric DEFAULT 10.0;

COMMENT ON COLUMN public.workspace_credits.low_credit_threshold IS 'Limite mínimo de créditos antes de disparar alerta';

-- Add flag to track if alert was already shown
ALTER TABLE public.workspace_credits 
ADD COLUMN IF NOT EXISTS low_credit_alert_shown boolean DEFAULT false;

COMMENT ON COLUMN public.workspace_credits.low_credit_alert_shown IS 'Flag para evitar alertas repetidos';