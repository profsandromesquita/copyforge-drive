-- FASE 1: Expandir Schema do Projeto - Adicionar campos de Identidade Visual

-- Adicionar campo de estilos visuais (array de strings)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS visual_style TEXT[];

-- Adicionar campo de paleta de cores (JSONB estruturado)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS color_palette JSONB DEFAULT '{"primary": "", "secondary": "", "accent": "", "background": ""}';

-- Adicionar campo de estilo de imagens
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS imagery_style TEXT;

-- Comentários para documentação
COMMENT ON COLUMN projects.visual_style IS 'Estilos visuais da marca (ex: Minimalista, Moderno, Luxo)';
COMMENT ON COLUMN projects.color_palette IS 'Paleta de cores da marca em formato JSON com primary, secondary, accent, background';
COMMENT ON COLUMN projects.imagery_style IS 'Estilo preferido para imagens (ex: Fotografia Real, Ilustração Digital, 3D)';