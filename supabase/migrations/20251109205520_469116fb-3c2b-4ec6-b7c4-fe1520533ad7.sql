-- Adicionar política RLS para super admins verem todos os profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'super_admin'));