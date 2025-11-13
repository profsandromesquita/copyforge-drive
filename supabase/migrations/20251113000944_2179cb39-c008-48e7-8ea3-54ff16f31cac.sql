-- Adicionar coluna system_instruction para armazenar contexto compilado
ALTER TABLE copies 
ADD COLUMN system_instruction jsonb DEFAULT NULL;

COMMENT ON COLUMN copies.system_instruction IS 'Contexto compilado usado na geração: base prompt + identity + audience + offer + characteristics';

-- Criar índice para buscas por copies com system_instruction
CREATE INDEX idx_copies_system_instruction ON copies USING gin(system_instruction) WHERE system_instruction IS NOT NULL;