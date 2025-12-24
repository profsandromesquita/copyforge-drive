import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { handleSessionExpiredError } from "@/lib/auth-utils";

interface Workspace {
  id: string;
  name: string;
  avatar_url?: string | null;
  role: 'owner' | 'admin' | 'editor';
  is_active?: boolean;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspaces: Workspace[]; // Apenas workspaces ativos (para seleção)
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
  
  // Track last user ID to prevent duplicate fetches
  const lastUserIdRef = useRef<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchWorkspaces = async () => {
    if (!user?.id) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log('[Workspace] Fetch already in progress, skipping...');
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          role,
          workspace:workspaces!workspace_members_workspace_id_fkey (
            id,
            name,
            avatar_url,
            is_active
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('[Workspace] Error fetching workspaces:', error);
        
        // Se sessão expirou, fazer logout
        await handleSessionExpiredError(error);
        
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const workspaceList = data?.map((item: any) => ({
        id: item.workspace.id,
        name: item.workspace.name,
        avatar_url: item.workspace.avatar_url,
        role: item.role,
        is_active: item.workspace.is_active ?? true
      })) || [];

      console.log('[Workspace] Fetched workspaces:', workspaceList.length);

      setWorkspaces(workspaceList);
      
      // Apenas workspaces ativos podem ser selecionados
      const activeWorkspacesList = workspaceList.filter(w => w.is_active);
      
      // Update active workspace or set first ACTIVE workspace
      if (activeWorkspacesList.length > 0) {
        if (activeWorkspace) {
          // Update active workspace with fresh data se ainda estiver ativo
          const updatedActiveWorkspace = activeWorkspacesList.find(w => w.id === activeWorkspace.id);
          if (updatedActiveWorkspace) {
            setActiveWorkspaceState(updatedActiveWorkspace);
          } else {
            // Se o workspace ativo ficou inativo, selecionar outro
            setActiveWorkspaceState(activeWorkspacesList[0]);
          }
        } else {
          // Set first ACTIVE workspace as active if none selected
          const savedWorkspaceId = localStorage.getItem('activeWorkspaceId');
          const workspace = savedWorkspaceId 
            ? activeWorkspacesList.find(w => w.id === savedWorkspaceId) || activeWorkspacesList[0]
            : activeWorkspacesList[0];
          setActiveWorkspaceState(workspace);
        }
      } else {
        console.log('[Workspace] No active workspaces found');
        setActiveWorkspaceState(null);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  // Use user.id as dependency instead of user object to prevent re-fetches on token refresh
  useEffect(() => {
    const userId = user?.id;
    
    // Skip if user ID hasn't changed
    if (userId === lastUserIdRef.current) {
      return;
    }
    
    lastUserIdRef.current = userId ?? null;
    
    if (!userId) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setLoading(false);
      return;
    }

    fetchWorkspaces();

    // Setup realtime subscription for workspace changes
    const channel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `user_id=eq.${userId}`
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
  }, [user?.id]); // Only depend on user.id, not the entire user object

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
      activeWorkspaces: workspaces.filter(w => w.is_active),
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
