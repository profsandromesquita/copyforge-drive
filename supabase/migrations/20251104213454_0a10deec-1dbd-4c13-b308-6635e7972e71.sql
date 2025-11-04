-- Adicionar coluna de status
ALTER TABLE copies 
ADD COLUMN status text DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- Adicionar coluna para indicar se é template
ALTER TABLE copies 
ADD COLUMN is_template boolean DEFAULT false;

-- Criar índice para buscar templates mais rapidamente
CREATE INDEX idx_copies_is_template ON copies(is_template) WHERE is_template = true;