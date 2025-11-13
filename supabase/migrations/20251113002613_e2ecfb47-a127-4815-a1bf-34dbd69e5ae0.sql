-- Add system_instruction column to ai_generation_history
ALTER TABLE ai_generation_history 
ADD COLUMN system_instruction jsonb;

COMMENT ON COLUMN ai_generation_history.system_instruction IS 
'System instruction compilado usado nesta geração específica';