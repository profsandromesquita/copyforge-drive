import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanOffer } from "./usePlanOffers";

export const useWorkspaceOffer = (workspaceId: string | undefined) => {
  return useQuery({
    queryKey: ['workspace-offer', workspaceId],
    queryFn: async (): Promise<PlanOffer | null> => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from('workspace_subscriptions')
        .select('plan_offers!fk_subscriptions_offer(*)')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching workspace offer:', error);
        return null;
      }

      return data?.plan_offers as PlanOffer | null;
    },
    enabled: !!workspaceId,
  });
};
