import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./useWorkspace";

interface WorkspaceCredits {
  balance: number;
  total_added: number;
  total_used: number;
}

export const useWorkspaceCredits = () => {
  const { activeWorkspace } = useWorkspace();

  return useQuery({
    queryKey: ['workspace-credits', activeWorkspace?.id],
    queryFn: async (): Promise<WorkspaceCredits | null> => {
      if (!activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from('workspace_credits')
        .select('balance, total_added, total_used')
        .eq('workspace_id', activeWorkspace.id)
        .single();

      if (error) {
        console.error('Error fetching workspace credits:', error);
        throw error;
      }

      return data;
    },
    enabled: !!activeWorkspace?.id,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};
