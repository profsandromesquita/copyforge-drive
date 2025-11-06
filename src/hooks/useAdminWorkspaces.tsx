import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkspaceOwner {
  name: string;
  email: string;
  avatar_url?: string;
}

interface WorkspaceData {
  id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  owner: WorkspaceOwner;
  members_count: number;
  projects_count: number;
}

export const useAdminWorkspaces = () => {
  return useQuery({
    queryKey: ['admin-workspaces'],
    queryFn: async () => {
      // Fetch all workspaces
      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (workspacesError) throw workspacesError;
      if (!workspaces) return [];

      // For each workspace, fetch owner, member count, and project count
      const workspacesData = await Promise.all(
        workspaces.map(async (workspace) => {
          // Get owner
          const { data: ownerMember } = await supabase
            .from('workspace_members')
            .select('user_id, profiles(name, email, avatar_url)')
            .eq('workspace_id', workspace.id)
            .eq('role', 'owner')
            .single();

          // Count members
          const { count: membersCount } = await supabase
            .from('workspace_members')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id);

          // Count projects
          const { count: projectsCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id);

          const ownerProfile = ownerMember?.profiles as any;

          return {
            id: workspace.id,
            name: workspace.name,
            avatar_url: workspace.avatar_url,
            created_at: workspace.created_at,
            owner: {
              name: ownerProfile?.name || 'Desconhecido',
              email: ownerProfile?.email || '',
              avatar_url: ownerProfile?.avatar_url,
            },
            members_count: membersCount || 0,
            projects_count: projectsCount || 0,
          } as WorkspaceData;
        })
      );

      return workspacesData;
    },
  });
};
