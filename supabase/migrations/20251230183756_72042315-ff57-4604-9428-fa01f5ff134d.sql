-- Adicionar política RLS para super admins verem todas as copies
CREATE POLICY "Super admins can view all copies"
ON public.copies
FOR SELECT
USING (has_system_role(auth.uid(), 'super_admin'::system_role));