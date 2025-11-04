-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Admins can add workspace members" ON workspace_members;

-- Create a new policy that allows inserting yourself as a member when creating a workspace
-- OR when you're already an admin of that workspace
CREATE POLICY "Users can add workspace members"
ON workspace_members
FOR INSERT
WITH CHECK (
  -- Allow adding yourself as a member (for new workspaces)
  auth.uid() = user_id
  OR
  -- Or if you're already an admin of the workspace
  public.is_workspace_admin(auth.uid(), workspace_id)
);