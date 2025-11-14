-- Adicionar coluna methodology na tabela projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS methodology jsonb DEFAULT NULL;