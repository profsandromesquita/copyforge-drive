-- Drop the restrictive select policy
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;

-- Create new policy that allows viewing workspaces you're a member of OR created
CREATE POLICY "Users can view their workspaces"
ON workspaces
FOR SELECT
USING (
  -- You can view if you're a member
  public.is_workspace_member(auth.uid(), id)
  OR
  -- Or if you created it (needed for the initial insert/select)
  auth.uid() = created_by
);