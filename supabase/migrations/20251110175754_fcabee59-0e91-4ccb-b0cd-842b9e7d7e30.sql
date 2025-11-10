-- Criar tabela de configuração de gateways de pagamento
CREATE TABLE payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(integration_id, workspace_id)
);

-- Criar tabela de logs de webhooks
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  headers JSONB,
  status TEXT NOT NULL,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_webhook_logs_integration ON webhook_logs(integration_slug);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at DESC);

-- Adicionar colunas para rastrear gateway de pagamento
ALTER TABLE workspace_subscriptions
ADD COLUMN payment_gateway TEXT,
ADD COLUMN external_subscription_id TEXT;

CREATE INDEX idx_workspace_subscriptions_external 
ON workspace_subscriptions(external_subscription_id, payment_gateway);

-- Adicionar coluna metadata em integrations
ALTER TABLE integrations 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Atualizar Ticto com metadata
UPDATE integrations 
SET metadata = '{
  "type": "payment_gateway",
  "supports_webhook": true,
  "webhook_path": "/webhook-ticto",
  "required_config": ["validation_token", "offer_mappings"]
}'::jsonb
WHERE slug = 'ticto';

-- RLS Policies
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage gateways"
  ON payment_gateways FOR ALL
  USING (has_system_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view logs"
  ON webhook_logs FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

-- Função para testar conexão Ticto
CREATE OR REPLACE FUNCTION test_ticto_connection(p_validation_token TEXT)
RETURNS JSON AS $$
BEGIN
  IF p_validation_token IS NULL OR LENGTH(p_validation_token) < 10 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Token de validação inválido ou muito curto'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Configuração válida! Pronto para receber webhooks.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;