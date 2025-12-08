-- Fase 0: Remover Foreign Keys duplicadas que podem bloquear CASCADE
-- Mantendo apenas copies_project_id_fkey e folders_project_id_fkey (que têm CASCADE)

ALTER TABLE IF EXISTS copies DROP CONSTRAINT IF EXISTS fk_copies_project;
ALTER TABLE IF EXISTS folders DROP CONSTRAINT IF EXISTS fk_folders_project;