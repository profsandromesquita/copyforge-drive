-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add folder_id to copies table
ALTER TABLE public.copies 
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_folders_workspace ON public.folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_folders_project ON public.folders(project_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_copies_folder ON public.copies(folder_id);

-- Enable RLS on folders table
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders
CREATE POLICY "Users can view folders in their workspaces"
ON public.folders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create folders in their workspaces"
ON public.folders
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update folders in their workspaces"
ON public.folders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = folders.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete folders they created"
ON public.folders
FOR DELETE
USING (auth.uid() = created_by);

-- Trigger to update updated_at
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();