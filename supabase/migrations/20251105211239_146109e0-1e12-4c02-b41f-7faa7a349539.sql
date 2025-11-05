-- Adicionar colunas para rastreamento de uso de IA na tabela ai_generation_history
ALTER TABLE public.ai_generation_history
ADD COLUMN IF NOT EXISTS model_used text,
ADD COLUMN IF NOT EXISTS generation_category text CHECK (generation_category IN ('text', 'image')),
ADD COLUMN IF NOT EXISTS input_tokens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS output_tokens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tokens integer DEFAULT 0;

-- Criar índices para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_model_used ON public.ai_generation_history(model_used);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_generation_category ON public.ai_generation_history(generation_category);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_created_at ON public.ai_generation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_workspace_id ON public.ai_generation_history(workspace_id);