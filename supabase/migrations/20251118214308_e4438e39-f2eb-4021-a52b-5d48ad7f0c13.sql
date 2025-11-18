-- Criar tabela para mensagens do chat de copies
CREATE TABLE public.copy_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copy_id UUID NOT NULL REFERENCES public.copies(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_copy_chat_messages_copy_id ON public.copy_chat_messages(copy_id);
CREATE INDEX idx_copy_chat_messages_created_at ON public.copy_chat_messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.copy_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Usuários podem ver mensagens das copies em seus workspaces
CREATE POLICY "Users can view chat messages in their workspaces"
ON public.copy_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = copy_chat_messages.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Políticas RLS: Usuários podem criar mensagens em seus workspaces
CREATE POLICY "Users can create chat messages in their workspaces"
ON public.copy_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = copy_chat_messages.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Políticas RLS: Usuários podem deletar suas próprias mensagens
CREATE POLICY "Users can delete their own chat messages"
ON public.copy_chat_messages
FOR DELETE
USING (auth.uid() = user_id);