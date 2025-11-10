-- Add RLS policy for super admins to view all workspace members
CREATE POLICY "Super admins can view all workspace members"
ON public.workspace_members
FOR SELECT
USING (has_system_role(auth.uid(), 'super_admin'::system_role));