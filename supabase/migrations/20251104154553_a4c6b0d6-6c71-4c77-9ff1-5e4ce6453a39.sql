-- Temporary function to create super admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_super_admin(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = user_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário não encontrado com este email'
    );
  END IF;

  -- Check if already super admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = target_user_id AND role = 'super_admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário já é super admin'
    );
  END IF;

  -- Create super admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin');

  RETURN json_build_object(
    'success', true,
    'message', 'Super admin criado com sucesso!',
    'user_id', target_user_id
  );
END;
$$;