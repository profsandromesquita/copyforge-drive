import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Workspace {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'editor';
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        role,
        workspace:workspaces (
          id,
          name
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching workspaces:', error);
      setLoading(false);
      return;
    }

    const workspaceList = data?.map((item: any) => ({
      id: item.workspace.id,
      name: item.workspace.name,
      role: item.role
    })) || [];

    setWorkspaces(workspaceList);
    
    // Set first workspace as active if none selected
    if (workspaceList.length > 0 && !activeWorkspace) {
      const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');
      const workspace = savedWorkspaceId 
        ? workspaceList.find(w => w.id === savedWorkspaceId) || workspaceList[0]
        : workspaceList[0];
      setActiveWorkspaceState(workspace);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    localStorage.setItem('activeWorkspaceId', workspace.id);
  };

  const refreshWorkspaces = async () => {
    await fetchWorkspaces();
  };

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      activeWorkspace, 
      setActiveWorkspace, 
      loading,
      refreshWorkspaces 
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
