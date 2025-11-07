-- Add model tracking columns to ai_generation_history
ALTER TABLE ai_generation_history
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS was_auto_routed BOOLEAN DEFAULT false;

-- Update existing records to have the default model
UPDATE ai_generation_history
SET model_used = 'google/gemini-2.5-flash',
    was_auto_routed = true
WHERE model_used IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN ai_generation_history.model_used IS 'AI model used for generation (e.g., google/gemini-2.5-flash, openai/gpt-5-mini)';
COMMENT ON COLUMN ai_generation_history.was_auto_routed IS 'Whether the model was automatically selected based on copy type or manually chosen by user';