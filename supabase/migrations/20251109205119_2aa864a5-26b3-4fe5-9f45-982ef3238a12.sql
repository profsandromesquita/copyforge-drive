-- Adicionar política RLS para super admins verem todos os workspaces
CREATE POLICY "Super admins can view all workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'));