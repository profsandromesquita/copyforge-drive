-- Enum para status de faturas
CREATE TYPE invoice_status AS ENUM (
  'pending',
  'paid', 
  'failed',
  'cancelled',
  'refunded'
);

-- Tabela de faturas
CREATE TABLE workspace_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES workspace_subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_id TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_workspace_invoices_workspace ON workspace_invoices(workspace_id);
CREATE INDEX idx_workspace_invoices_status ON workspace_invoices(status);
CREATE INDEX idx_workspace_invoices_due_date ON workspace_invoices(due_date);

-- RLS Policies
ALTER TABLE workspace_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all invoices"
  ON workspace_invoices FOR SELECT
  USING (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage invoices"
  ON workspace_invoices FOR ALL
  USING (has_system_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Workspace admins can view their invoices"
  ON workspace_invoices FOR SELECT
  USING (is_workspace_admin(auth.uid(), workspace_id));

-- Trigger para updated_at
CREATE TRIGGER update_workspace_invoices_updated_at
  BEFORE UPDATE ON workspace_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function para gerar número de fatura
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year TEXT;
  month TEXT;
  sequence INT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  month := TO_CHAR(NOW(), 'MM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM '\d+$') AS INT)
  ), 0) + 1 INTO sequence
  FROM workspace_invoices
  WHERE invoice_number LIKE 'INV-' || year || month || '%';
  
  RETURN 'INV-' || year || month || '-' || LPAD(sequence::TEXT, 6, '0');
END;
$$;