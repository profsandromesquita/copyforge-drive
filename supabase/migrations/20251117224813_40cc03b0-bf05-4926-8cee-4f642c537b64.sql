-- FASE 1: Migração do Banco de Dados

-- Adicionar colunas na tabela copies para armazenar system prompt gerado
ALTER TABLE copies
ADD COLUMN IF NOT EXISTS generated_system_prompt TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_context_hash TEXT,
ADD COLUMN IF NOT EXISTS system_prompt_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS system_prompt_model TEXT DEFAULT 'openai/gpt-5-mini';

-- Adicionar colunas para contexto específico da copy
ALTER TABLE copies
ADD COLUMN IF NOT EXISTS selected_audience_id UUID REFERENCES projects(id),
ADD COLUMN IF NOT EXISTS selected_offer_id UUID,
ADD COLUMN IF NOT EXISTS copy_framework TEXT,
ADD COLUMN IF NOT EXISTS copy_objective TEXT,
ADD COLUMN IF NOT EXISTS copy_styles TEXT[],
ADD COLUMN IF NOT EXISTS copy_emotional_focus TEXT;

-- Adicionar colunas na tabela ai_generation_history
ALTER TABLE ai_generation_history
ADD COLUMN IF NOT EXISTS system_prompt_model TEXT DEFAULT 'openai/gpt-5-mini';

-- Criar índice para melhorar performance de busca por hash
CREATE INDEX IF NOT EXISTS idx_copies_context_hash ON copies(system_prompt_context_hash);

-- Comentários para documentação
COMMENT ON COLUMN copies.generated_system_prompt IS 'System prompt gerado pelo GPT-4 baseado no contexto do projeto e da copy';
COMMENT ON COLUMN copies.system_prompt_context_hash IS 'Hash MD5 do contexto usado para gerar o system prompt - permite invalidação inteligente';
COMMENT ON COLUMN copies.system_prompt_generated_at IS 'Timestamp de quando o system prompt foi gerado';
COMMENT ON COLUMN copies.system_prompt_model IS 'Modelo usado para gerar o system prompt (ex: openai/gpt-5-mini)';
COMMENT ON COLUMN copies.selected_audience_id IS 'ID do público-alvo selecionado para esta copy específica';
COMMENT ON COLUMN copies.selected_offer_id IS 'ID da oferta selecionada para esta copy específica';
COMMENT ON COLUMN copies.copy_framework IS 'Framework/estrutura escolhida para esta copy';
COMMENT ON COLUMN copies.copy_objective IS 'Objetivo específico desta copy';
COMMENT ON COLUMN copies.copy_styles IS 'Estilos selecionados para esta copy';
COMMENT ON COLUMN copies.copy_emotional_focus IS 'Foco emocional escolhido para esta copy';