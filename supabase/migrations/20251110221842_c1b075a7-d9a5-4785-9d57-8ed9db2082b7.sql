-- Garantir que workspace_invoices está completa e funcional
-- Adicionar campos que podem estar faltando

-- Verificar e adicionar coluna external_payment_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workspace_invoices' 
    AND column_name = 'external_payment_id'
  ) THEN
    ALTER TABLE workspace_invoices 
    ADD COLUMN external_payment_id TEXT;
    
    CREATE INDEX idx_workspace_invoices_external_payment_id 
    ON workspace_invoices(external_payment_id);
  END IF;
END $$;

-- Adicionar coluna event_category em webhook_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_logs' 
    AND column_name = 'event_category'
  ) THEN
    ALTER TABLE webhook_logs 
    ADD COLUMN event_category TEXT;
    
    CREATE INDEX idx_webhook_logs_event_category 
    ON webhook_logs(event_category);
  END IF;
END $$;

-- Criar view para análise de eventos
CREATE OR REPLACE VIEW webhook_events_summary AS
SELECT 
  integration_slug,
  event_category,
  event_type,
  status,
  COUNT(*) as total_events,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_events,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_events,
  MAX(created_at) as last_event_at
FROM webhook_logs
GROUP BY integration_slug, event_category, event_type, status;

-- Adicionar comentários para documentação
COMMENT ON COLUMN workspace_invoices.external_payment_id IS 'ID da transação/pedido no gateway de pagamento (order.hash da Ticto)';
COMMENT ON COLUMN webhook_logs.event_category IS 'Categoria do evento: payment, subscription, refund, etc.';