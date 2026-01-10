import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Project } from '@/types/project-config';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from './useWorkspace';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Delay before fetching projects after workspace changes
const FETCH_DELAY_MS = 300;

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true); // Inicia true para evitar flash no Drive
  const { activeWorkspace } = useWorkspace();
  const { user, authReady } = useAuth();
  
  const fetchDelayRef = useRef<NodeJS.Timeout | null>(null);
  const lastWorkspaceIdRef = useRef<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!activeWorkspace?.id) {
      setProjects([]);
      setActiveProjectState(null);
      setLoading(false); // Sem workspace = sem projetos para carregar
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects = (data as unknown as Project[]) || [];
      setProjects(projects);

      // Restore active project from localStorage
      const storedProjectId = localStorage.getItem(`activeProjectId_${activeWorkspace.id}`);
      if (storedProjectId && projects.length > 0) {
        const found = projects.find(p => p.id === storedProjectId);
        if (found) {
          setActiveProjectState(found);
        } else if (projects.length > 0) {
          // If stored project not found, select first one
          setActiveProjectState(projects[0]);
          localStorage.setItem(`activeProjectId_${activeWorkspace.id}`, projects[0].id);
        }
      } else if (projects.length > 0) {
        // No stored project, select first one
        setActiveProjectState(projects[0]);
        localStorage.setItem(`activeProjectId_${activeWorkspace.id}`, projects[0].id);
      } else {
        // No projects in this workspace
        setActiveProjectState(null);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  // Clear active project immediately when workspace changes
  useEffect(() => {
    setActiveProjectState(null);
    setProjects([]);
  }, [activeWorkspace?.id]);

  // Use activeWorkspace.id AND authReady as dependencies
  useEffect(() => {
    // Clear pending fetch on dependency change
    if (fetchDelayRef.current) {
      clearTimeout(fetchDelayRef.current);
      fetchDelayRef.current = null;
    }
    
    // Don't fetch until auth is ready
    if (!authReady) {
      return;
    }
    
    const workspaceId = activeWorkspace?.id;
    
    // Skip if workspace hasn't changed
    if (workspaceId === lastWorkspaceIdRef.current && workspaceId) {
      return;
    }
    
    lastWorkspaceIdRef.current = workspaceId ?? null;
    
    if (workspaceId) {
      // Small delay to prevent rapid successive fetches
      fetchDelayRef.current = setTimeout(() => {
        fetchProjects();
      }, FETCH_DELAY_MS);
    }
    
    return () => {
      if (fetchDelayRef.current) {
        clearTimeout(fetchDelayRef.current);
      }
    };
  }, [activeWorkspace?.id, authReady, fetchProjects]);

  const setActiveProject = useCallback((project: Project | null) => {
    setActiveProjectState(project);
    if (project && activeWorkspace) {
      localStorage.setItem(`activeProjectId_${activeWorkspace.id}`, project.id);
    }
  }, [activeWorkspace]);

  const createProject = useCallback(async (name: string): Promise<Project | null> => {
    if (!activeWorkspace?.id || !user?.id) {
      toast.error('Workspace ou usuário não encontrado');
      return null;
    }

    try {
      // Verificar limite de projetos
      const { data: limitCheck } = await supabase.rpc('check_plan_limit', {
        p_workspace_id: activeWorkspace.id,
        p_limit_type: 'projects'
      });

      const limitData = limitCheck as any;
      if (!limitData?.allowed) {
        // Disparar evento para abrir modal de upgrade
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', {
          detail: {
            limitType: 'projects',
            currentLimit: limitData?.limit,
            currentUsage: limitData?.current
          }
        }));
        return null;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          workspace_id: activeWorkspace.id,
          name,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const project = data as unknown as Project;
      toast.success('Projeto criado com sucesso!');
      await fetchProjects();
      setActiveProject(project);
      return project;
    } catch (error: any) {
      console.error('Error creating project:', error);
      if (error.code === '23505') {
        toast.error('Já existe um projeto com este nome neste workspace');
      } else {
        toast.error('Erro ao criar projeto');
      }
      return null;
    }
  }, [activeWorkspace, user, fetchProjects, setActiveProject]);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!activeWorkspace?.id) {
      toast.error('Workspace não encontrado');
      return false;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Atualizar lista local de projetos
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);

      // Se o projeto excluído era o ativo, selecionar próximo
      if (activeProject?.id === projectId) {
        if (updatedProjects.length > 0) {
          setActiveProject(updatedProjects[0]);
        } else {
          setActiveProjectState(null);
          // Limpar localStorage
          localStorage.removeItem(`activeProjectId_${activeWorkspace.id}`);
        }
      }

      toast.success('Projeto excluído com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Erro ao excluir projeto');
      return false;
    }
  }, [activeWorkspace?.id, activeProject?.id, projects, setActiveProject]);

  const value: ProjectContextType = {
    projects,
    activeProject,
    setActiveProject,
    loading,
    refreshProjects: fetchProjects,
    createProject,
    deleteProject,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
