-- Adicionar política para super admins verem todas as gerações de IA
CREATE POLICY "Super admins can view all AI generations"
ON public.ai_generation_history
FOR SELECT
TO authenticated
USING (
  has_system_role(auth.uid(), 'super_admin'::system_role)
);