-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create policy that allows anyone (including anonymous users) to view profiles
CREATE POLICY "Anyone can view basic profile info"
ON public.profiles
FOR SELECT
TO public
USING (true);