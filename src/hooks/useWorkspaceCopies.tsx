import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkspaceCopy {
  id: string;
  title: string;
  copy_type: string;
  status: string;
  is_template: boolean;
  is_public: boolean;
  show_in_discover: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string | null;
  sessions: any;
  creator: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  project?: {
    name: string;
  };
}

interface UseWorkspaceCopiesParams {
  workspaceId: string;
  copyType?: string;
  status?: string;
  isTemplate?: boolean;
  isPublic?: boolean;
}

export const useWorkspaceCopies = (params: UseWorkspaceCopiesParams) => {
  const { workspaceId, copyType, status, isTemplate, isPublic } = params;

  return useQuery({
    queryKey: ['workspace-copies', workspaceId, copyType, status, isTemplate, isPublic],
    queryFn: async (): Promise<WorkspaceCopy[]> => {
      // Usa VIEW basic_profiles (sem PII) para dados do criador
      let query = supabase
        .from('copies')
        .select(`
          *,
          creator:basic_profiles!copies_created_by_fkey(name, email, avatar_url),
          project:projects!copies_project_id_fkey(name)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (copyType) {
        query = query.eq('copy_type', copyType);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (isTemplate !== undefined) {
        query = query.eq('is_template', isTemplate);
      }

      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching workspace copies:', error);
        throw error;
      }

      return data as WorkspaceCopy[];
    },
    enabled: !!workspaceId,
  });
};
