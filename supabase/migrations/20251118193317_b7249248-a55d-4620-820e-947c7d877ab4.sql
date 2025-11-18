-- Atualizar model_routing_config para usar openai/gpt-5 em vez de gpt-5-mini
UPDATE model_routing_config
SET 
  available_models = ARRAY['google/gemini-2.5-flash', 'openai/gpt-5']::text[],
  default_model = CASE 
    WHEN default_model = 'openai/gpt-5-mini' THEN 'openai/gpt-5'
    ELSE default_model
  END,
  updated_at = NOW()
WHERE 'openai/gpt-5-mini' = ANY(available_models);

-- Verificar resultado
SELECT copy_type, copy_type_label, default_model, available_models 
FROM model_routing_config 
ORDER BY copy_type;