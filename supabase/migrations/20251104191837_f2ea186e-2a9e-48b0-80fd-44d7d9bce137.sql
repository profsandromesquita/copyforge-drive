-- Create workspace_invitations table
CREATE TABLE public.workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role workspace_role NOT NULL,
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Create unique index to prevent duplicate pending invites
CREATE UNIQUE INDEX idx_unique_pending_invites 
ON public.workspace_invitations (workspace_id, email) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Workspace admins can view invitations for their workspace
CREATE POLICY "Workspace admins can view invitations"
ON public.workspace_invitations
FOR SELECT
USING (
  is_workspace_admin(auth.uid(), workspace_id)
);

-- Policy: Workspace admins can create invitations
CREATE POLICY "Workspace admins can create invitations"
ON public.workspace_invitations
FOR INSERT
WITH CHECK (
  is_workspace_admin(auth.uid(), workspace_id)
);

-- Policy: Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
ON public.workspace_invitations
FOR SELECT
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL -- Allow unauthenticated users to check by token
);

-- Policy: Users can update invitations sent to their email (accept/decline)
CREATE POLICY "Users can update their own invitations"
ON public.workspace_invitations
FOR UPDATE
USING (
  email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL -- Allow unauthenticated users via token
);

-- Policy: Workspace admins can delete invitations
CREATE POLICY "Workspace admins can delete invitations"
ON public.workspace_invitations
FOR DELETE
USING (
  is_workspace_admin(auth.uid(), workspace_id)
);