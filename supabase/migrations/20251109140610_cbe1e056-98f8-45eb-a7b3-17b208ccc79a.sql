-- Policy para permitir triggers inserirem profiles
CREATE POLICY "Triggers can insert profiles"
ON public.profiles
FOR INSERT
TO postgres, supabase_auth_admin
WITH CHECK (true);

-- Policy para permitir triggers criarem workspaces
CREATE POLICY "Triggers can create workspaces"
ON public.workspaces
FOR INSERT
TO postgres, authenticator
WITH CHECK (true);

-- Policy para permitir triggers adicionarem workspace members
CREATE POLICY "Triggers can add workspace members"
ON public.workspace_members
FOR INSERT
TO postgres, authenticator
WITH CHECK (true);