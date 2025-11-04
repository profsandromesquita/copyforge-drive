-- Add avatar_url column to workspaces table
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create workspace-avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-avatars', 'workspace-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for workspace avatars
CREATE POLICY "Workspace members can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'workspace-avatars');

CREATE POLICY "Workspace admins can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workspace-avatars' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Workspace admins can update avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'workspace-avatars' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Workspace admins can delete avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workspace-avatars' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);