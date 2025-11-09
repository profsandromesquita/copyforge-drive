-- Simplesmente remover a view problemática
-- Super admins podem usar a função auto_fix_orphaned_users() para monitorar e corrigir

DROP VIEW IF EXISTS public.users_without_workspace;