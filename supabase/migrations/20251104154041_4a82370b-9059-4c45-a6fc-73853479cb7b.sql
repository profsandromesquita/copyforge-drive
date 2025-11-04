-- Create copies table
CREATE TABLE public.copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova Copy',
  sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for copies
CREATE POLICY "Users can view copies in their workspaces"
  ON public.copies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = copies.workspace_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create copies in their workspaces"
  ON public.copies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = copies.workspace_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update copies in their workspaces"
  ON public.copies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = copies.workspace_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete copies they created"
  ON public.copies FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_copies_updated_at
  BEFORE UPDATE ON public.copies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();