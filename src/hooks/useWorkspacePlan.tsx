import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WorkspacePlan {
  plan_name: string;
  plan_slug: string;
}

export const useWorkspacePlan = (workspaceId: string | undefined) => {
  return useQuery({
    queryKey: ['workspace-plan', workspaceId],
    queryFn: async (): Promise<WorkspacePlan | null> => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from('workspace_subscriptions')
        .select('subscription_plans!fk_subscriptions_plan(name, slug)')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching workspace plan:', error);
        return null;
      }

      const plan = data?.subscription_plans as any;
      
      return {
        plan_name: plan?.name || 'Free',
        plan_slug: plan?.slug || 'free',
      };
    },
    enabled: !!workspaceId,
  });
};
