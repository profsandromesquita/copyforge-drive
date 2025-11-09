-- =====================================================
-- MIGRATION: Criar tabela ai_characteristics e popular
-- =====================================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS ai_characteristics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('objetivos', 'estilos', 'tamanhos', 'preferencias')),
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, value)
);

-- Habilitar RLS
ALTER TABLE ai_characteristics ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autenticados podem ler características ativas
CREATE POLICY "Users can view active characteristics"
  ON ai_characteristics FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Super admins podem gerenciar tudo
CREATE POLICY "Super admins can manage characteristics"
  ON ai_characteristics FOR ALL
  TO authenticated
  USING (has_system_role(auth.uid(), 'super_admin'));

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_ai_characteristics_updated_at
  BEFORE UPDATE ON ai_characteristics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Popular com características atuais
INSERT INTO ai_characteristics (category, value, label, display_order) VALUES
  -- Objetivos
  ('objetivos', 'venda', 'Venda', 1),
  ('objetivos', 'engajamento', 'Engajamento', 2),
  
  -- Estilos
  ('estilos', 'girias', 'Uso de Gírias', 1),
  ('estilos', 'tecnico', 'Técnico', 2),
  ('estilos', 'casual', 'Casual', 3),
  ('estilos', 'formal', 'Formal', 4),
  ('estilos', 'didatico', 'Didático', 5),
  ('estilos', 'emocional', 'Emocional', 6),
  
  -- Tamanhos
  ('tamanhos', 'curta', 'Curta', 1),
  ('tamanhos', 'conciso', 'Conciso', 2),
  ('tamanhos', 'extenso', 'Extenso', 3),
  
  -- Preferências
  ('preferencias', 'cta', 'CTA', 1),
  ('preferencias', 'emoji', 'Emoji', 2)
ON CONFLICT (category, value) DO UPDATE SET
  label = EXCLUDED.label,
  display_order = EXCLUDED.display_order;