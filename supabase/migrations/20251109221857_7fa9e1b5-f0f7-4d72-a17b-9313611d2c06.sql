-- Adicionar política RLS para usuários autenticados lerem seu próprio profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);