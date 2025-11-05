-- Add columns to track optimization and variation generations
ALTER TABLE ai_generation_history 
ADD COLUMN IF NOT EXISTS generation_type text DEFAULT 'create' CHECK (generation_type IN ('create', 'optimize', 'variation')),
ADD COLUMN IF NOT EXISTS original_content jsonb;