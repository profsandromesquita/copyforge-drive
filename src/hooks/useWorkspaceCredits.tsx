import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./useWorkspace";
import { useAuth } from "./useAuth";

interface WorkspaceCredits {
  balance: number;
  total_added: number;
  total_used: number;
}

// Default credits when workspace has no credits record yet
const DEFAULT_CREDITS: WorkspaceCredits = {
  balance: 0,
  total_added: 0,
  total_used: 0,
};

export const useWorkspaceCredits = () => {
  const { activeWorkspace } = useWorkspace();
  const { authReady } = useAuth();

  return useQuery({
    queryKey: ['workspace-credits', activeWorkspace?.id],
    queryFn: async (): Promise<WorkspaceCredits> => {
      if (!activeWorkspace?.id) return DEFAULT_CREDITS;

      // Use maybeSingle() instead of single() to handle 0 rows gracefully
      const { data, error } = await supabase
        .from('workspace_credits')
        .select('balance, total_added, total_used')
        .eq('workspace_id', activeWorkspace.id)
        .maybeSingle();

      if (error) {
        // PGRST116 means no rows - not an error for credits
        if (error.code === 'PGRST116') {
          console.log('[useWorkspaceCredits] No credits record found, using defaults');
          return DEFAULT_CREDITS;
        }
        console.error('Error fetching workspace credits:', error);
        // Return defaults instead of throwing to prevent UI errors
        return DEFAULT_CREDITS;
      }

      // Handle null data (no record exists)
      if (!data) {
        console.log('[useWorkspaceCredits] No credits record, using defaults');
        return DEFAULT_CREDITS;
      }

      return data;
    },
    // Only enable when auth is ready AND workspace is set
    enabled: !!activeWorkspace?.id && authReady,
    // Reduce refetch frequency to prevent rate limiting
    refetchInterval: 60000, // 60 seconds instead of 30
    // Don't retry on errors to prevent request storms
    retry: false,
    // Use stale data while refetching
    staleTime: 30000,
  });
};
