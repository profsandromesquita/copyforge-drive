-- Adicionar coluna platform à tabela copies para persistência de limites de caracteres por rede social
ALTER TABLE copies ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT NULL;

COMMENT ON COLUMN copies.platform IS 'Plataforma de destino para limites de caracteres (x_twitter, instagram, linkedin, etc.)';