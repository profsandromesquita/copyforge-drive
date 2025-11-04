-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ABA 1: IDENTIDADE
  brand_name TEXT,
  sector TEXT,
  central_purpose TEXT,
  voice_tones TEXT[], -- Array para múltipla escolha
  brand_personality TEXT[], -- Array para múltipla escolha
  keywords TEXT[], -- Array de palavras-chave
  
  -- Configurações completas armazenadas como JSONB para flexibilidade
  audience_segments JSONB DEFAULT '[]'::jsonb, -- Array de segmentos
  offers JSONB DEFAULT '[]'::jsonb, -- Array de ofertas
  
  UNIQUE(workspace_id, name)
);

-- Índices para performance
CREATE INDEX idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);

-- RLS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Usuários podem visualizar projetos dos workspaces que pertencem
CREATE POLICY "Users can view projects in their workspaces"
ON public.projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = projects.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Usuários podem criar projetos nos workspaces que pertencem
CREATE POLICY "Users can create projects in their workspaces"
ON public.projects FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = projects.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Usuários podem atualizar projetos nos workspaces que pertencem
CREATE POLICY "Users can update projects in their workspaces"
ON public.projects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = projects.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

-- Apenas criadores ou admins/owners podem deletar
CREATE POLICY "Users can delete own projects"
ON public.projects FOR DELETE
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = projects.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('owner', 'admin')
  )
);

-- Atualizar tabela copies para vincular aos projetos
ALTER TABLE public.copies
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_copies_project ON public.copies(project_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_projects_updated_at();