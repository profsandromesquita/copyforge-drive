-- Create feedback_reports table
CREATE TABLE public.feedback_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL,
  user_agent TEXT,
  screen_resolution TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'suggestion', 'question', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON public.feedback_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.feedback_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Super admins can view all feedback
CREATE POLICY "Super admins can view all feedback"
ON public.feedback_reports
FOR SELECT
USING (has_system_role(auth.uid(), 'super_admin'::system_role));

-- Policy: Super admins can update any feedback
CREATE POLICY "Super admins can update feedback"
ON public.feedback_reports
FOR UPDATE
USING (has_system_role(auth.uid(), 'super_admin'::system_role))
WITH CHECK (has_system_role(auth.uid(), 'super_admin'::system_role));

-- Trigger for updated_at
CREATE TRIGGER update_feedback_reports_updated_at
BEFORE UPDATE ON public.feedback_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_feedback_reports_user_id ON public.feedback_reports(user_id);
CREATE INDEX idx_feedback_reports_status ON public.feedback_reports(status);
CREATE INDEX idx_feedback_reports_created_at ON public.feedback_reports(created_at DESC);