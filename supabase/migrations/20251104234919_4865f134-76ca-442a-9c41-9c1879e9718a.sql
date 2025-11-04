-- Criar tabela para histórico de gerações da IA
CREATE TABLE public.ai_generation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  copy_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contexto usado na geração
  copy_type TEXT,
  project_identity JSONB,
  audience_segment JSONB,
  offer JSONB,
  parameters JSONB,
  prompt TEXT NOT NULL,
  
  -- Resultado gerado
  sessions JSONB NOT NULL,
  
  CONSTRAINT fk_copy FOREIGN KEY (copy_id) REFERENCES public.copies(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_ai_generation_history_copy_id ON public.ai_generation_history(copy_id);
CREATE INDEX idx_ai_generation_history_workspace_id ON public.ai_generation_history(workspace_id);
CREATE INDEX idx_ai_generation_history_created_at ON public.ai_generation_history(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.ai_generation_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view history in their workspaces"
ON public.ai_generation_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = ai_generation_history.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create history in their workspaces"
ON public.ai_generation_history
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = ai_generation_history.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own history"
ON public.ai_generation_history
FOR DELETE
USING (auth.uid() = created_by);