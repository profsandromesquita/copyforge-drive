import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Workspace {
  id: string;
  name: string;
  avatar_url?: string | null;
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

  const fetchWorkspaces = async (retryCount = 0) => {
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
          name,
          avatar_url
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
      avatar_url: item.workspace.avatar_url,
      role: item.role
    })) || [];

    // Retry mechanism for new users - workspace might still be creating
    if (workspaceList.length === 0 && retryCount < 3) {
      console.log(`[Workspace] No workspaces found, retrying in ${(retryCount + 1) * 1000}ms...`);
      setTimeout(() => {
        fetchWorkspaces(retryCount + 1);
      }, (retryCount + 1) * 1000);
      return;
    }

    setWorkspaces(workspaceList);
    
    // Update active workspace or set first workspace as active
    if (workspaceList.length > 0) {
      if (activeWorkspace) {
        // Update active workspace with fresh data
        const updatedActiveWorkspace = workspaceList.find(w => w.id === activeWorkspace.id);
        if (updatedActiveWorkspace) {
          setActiveWorkspaceState(updatedActiveWorkspace);
        }
      } else {
        // Set first workspace as active if none selected
        const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const workspace = savedWorkspaceId 
          ? workspaceList.find(w => w.id === savedWorkspaceId) || workspaceList[0]
          : workspaceList[0];
        setActiveWorkspaceState(workspace);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();

    // Setup realtime subscription for workspace changes
    if (!user) return;

    const channel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('[Workspace] Realtime update detected, refreshing...');
          fetchWorkspaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
