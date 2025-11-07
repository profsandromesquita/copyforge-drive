-- Permitir NULL na coluna generation_id
ALTER TABLE credit_transactions 
ALTER COLUMN generation_id DROP NOT NULL;

-- Remover a constraint antiga
ALTER TABLE credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_generation_id_fkey;

-- Recriar a constraint com ON DELETE SET NULL
ALTER TABLE credit_transactions 
ADD CONSTRAINT credit_transactions_generation_id_fkey 
FOREIGN KEY (generation_id) 
REFERENCES ai_generation_history(id) 
ON DELETE SET NULL;