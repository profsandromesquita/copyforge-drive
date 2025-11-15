-- Remover constraint de categoria se existir
ALTER TABLE ai_characteristics DROP CONSTRAINT IF EXISTS ai_characteristics_category_check;

-- Upsert frameworks de copywriting (Estrutura)
INSERT INTO ai_characteristics (category, value, label, description, display_order, is_active) VALUES
('frameworks', 'aida', 'AIDA', 'Atenção → Interesse → Desejo → Ação', 1, true),
('frameworks', 'pas', 'PAS', 'Problema → Agitação → Solução', 2, true),
('frameworks', 'fab', 'FAB', 'Característica → Vantagem → Benefício', 3, true),
('frameworks', '4ps', '4Ps', 'Imagem → Promessa → Prova → Empurrão', 4, true),
('frameworks', 'quest', 'QUEST', 'Qualificar → Compreender → Educar → Estimular → Transição', 5, true),
('frameworks', 'bab', 'BAB', 'Antes → Depois → Ponte', 6, true),
('frameworks', 'pastor', 'PASTOR', 'Problema → Amplificar → História → Transformação → Oferta → Resposta', 7, true)
ON CONFLICT (category, value) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Upsert focos emocionais
INSERT INTO ai_characteristics (category, value, label, description, display_order, is_active) VALUES
('foco_emocional', 'dor', 'Dor', 'Amplificar problema', 1, true),
('foco_emocional', 'desejo', 'Desejo', 'Amplificar aspiração', 2, true),
('foco_emocional', 'transformacao', 'Transformação', 'Antes → Depois', 3, true),
('foco_emocional', 'prevencao', 'Prevenção', 'Evitar perda', 4, true)
ON CONFLICT (category, value) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Desativar objetivos antigos
UPDATE ai_characteristics SET is_active = false WHERE category = 'objetivos';

-- Upsert novos objetivos
INSERT INTO ai_characteristics (category, value, label, description, display_order, is_active) VALUES
('objetivos', 'venda_direta', 'Venda Direta', 'Conversão imediata de vendas', 1, true),
('objetivos', 'geracao_leads', 'Geração de Leads', 'Capturar contatos qualificados', 2, true),
('objetivos', 'engajamento', 'Engajamento/Viralização', 'Aumentar interação e compartilhamento', 3, true),
('objetivos', 'educacao', 'Educação/Conhecimento', 'Informar e educar o público', 4, true),
('objetivos', 'retencao', 'Retenção/Fidelização', 'Manter e fortalecer relacionamento com clientes', 5, true),
('objetivos', 'upsell', 'Upsell/Cross-sell', 'Aumentar ticket médio', 6, true),
('objetivos', 'reativacao', 'Reativação', 'Recuperar clientes inativos', 7, true)
ON CONFLICT (category, value) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Desativar estilos antigos
UPDATE ai_characteristics SET is_active = false WHERE category = 'estilos';

-- Upsert novos estilos
INSERT INTO ai_characteristics (category, value, label, description, display_order, is_active) VALUES
('estilos', 'storytelling', 'Storytelling', 'Narrativa envolvente com história', 1, true),
('estilos', 'controverso', 'Controverso/Disruptivo', 'Quebra de padrões e provocação', 2, true),
('estilos', 'aspiracional', 'Aspiracional/Luxo', 'Foco em status e sofisticação', 3, true),
('estilos', 'urgente', 'Urgente/Alarmista', 'Senso de urgência e escassez', 4, true),
('estilos', 'cientifico', 'Científico/Baseado em dados', 'Fatos, estatísticas e evidências', 5, true),
('estilos', 'conversacional', 'Conversacional/Amigável', 'Tom próximo e acessível', 6, true),
('estilos', 'mistico', 'Místico/Espiritual', 'Conexão emocional profunda', 7, true)
ON CONFLICT (category, value) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;