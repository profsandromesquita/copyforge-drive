import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkspaceMember {
  id: string;
  role: string;
  invited_at: string;
  profiles: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Workspace {
  id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface WorkspaceDetailsData {
  workspace: Workspace | null;
  members: WorkspaceMember[];
  projects: Project[];
}

export const useWorkspaceDetails = (workspaceId: string) => {
  return useQuery({
    queryKey: ['workspace-details', workspaceId],
    queryFn: async (): Promise<WorkspaceDetailsData> => {
      // Fetch workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) throw workspaceError;

      // Fetch members with profiles using foreign key
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select('id, role, invited_at, profiles!workspace_members_user_id_fkey(name, email, avatar_url)')
        .eq('workspace_id', workspaceId)
        .order('invited_at', { ascending: false });

      if (membersError) throw membersError;

      // Fetch projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, created_at, updated_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      return {
        workspace: workspace || null,
        members: (members || []) as WorkspaceMember[],
        projects: projects || [],
      };
    },
    enabled: !!workspaceId,
  });
};
