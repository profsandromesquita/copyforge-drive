-- Create function to check if user has a specific system role
CREATE OR REPLACE FUNCTION public.has_system_role(_user_id uuid, _role system_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;