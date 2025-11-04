-- Add copy_type column to copies table
ALTER TABLE copies ADD COLUMN copy_type TEXT DEFAULT 'outro';

-- Add check constraint for valid copy types
ALTER TABLE copies ADD CONSTRAINT copies_type_check 
CHECK (copy_type IN ('landing_page', 'anuncio', 'vsl', 'email', 'webinar', 'conteudo', 'mensagem', 'outro'));