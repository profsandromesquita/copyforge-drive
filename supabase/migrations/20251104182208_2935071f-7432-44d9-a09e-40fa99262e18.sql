-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of workspaces they belong to" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can remove members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners and admins can update members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners and admins can update workspace" ON workspaces;

-- Create security definer function to check workspace membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE user_id = _user_id 
    AND workspace_id = _workspace_id
  )
$$;

-- Create security definer function to check if user has specific role in workspace
CREATE OR REPLACE FUNCTION public.has_workspace_role_in(_user_id uuid, _workspace_id uuid, _role workspace_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE user_id = _user_id 
    AND workspace_id = _workspace_id
    AND role = _role
  )
$$;

-- Create security definer function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE user_id = _user_id 
    AND workspace_id = _workspace_id
    AND role IN ('owner', 'admin')
  )
$$;

-- Recreate workspace_members policies using security definer functions
CREATE POLICY "Users can view workspace members"
ON workspace_members
FOR SELECT
USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can add workspace members"
ON workspace_members
FOR INSERT
WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can remove workspace members"
ON workspace_members
FOR DELETE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update workspace members"
ON workspace_members
FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), workspace_id));

-- Recreate workspaces policies using security definer functions
CREATE POLICY "Users can view their workspaces"
ON workspaces
FOR SELECT
USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Admins can update workspaces"
ON workspaces
FOR UPDATE
USING (public.is_workspace_admin(auth.uid(), id));