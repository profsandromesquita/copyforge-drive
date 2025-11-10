import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  credits_per_month: number;
  rollover_enabled: boolean;
  rollover_percentage: number;
}

export interface WorkspaceSubscription {
  id: string;
  workspace_id: string;
  plan: SubscriptionPlan;
  billing_cycle: 'monthly' | 'annual' | 'free';
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  projects_count: number;
  copies_count: number;
  current_max_projects: number | null;
  current_max_copies: number | null;
  current_copy_ai_enabled: boolean;
  plan_offer_id?: string | null;
}

export const useWorkspaceSubscription = (workspaceId: string | undefined) => {
  return useQuery({
    queryKey: ['workspace-subscription', workspaceId],
    queryFn: async (): Promise<WorkspaceSubscription | null> => {
      if (!workspaceId) return null;

      const { data, error } = await supabase
        .from('workspace_subscriptions')
        .select(`
          id,
          workspace_id,
          billing_cycle,
          status,
          current_period_start,
          current_period_end,
          projects_count,
          copies_count,
          current_max_projects,
          current_max_copies,
          current_copy_ai_enabled,
          plan_offer_id,
          subscription_plans (
            id,
            name,
            slug,
            monthly_price,
            annual_price,
            max_projects,
            max_copies,
            copy_ai_enabled,
            credits_per_month,
            rollover_enabled,
            rollover_percentage
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error fetching workspace subscription:', error);
        return null;
      }

      if (!data) return null;

      const plan = data.subscription_plans as any;

      return {
        id: data.id,
        workspace_id: data.workspace_id,
        plan: {
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          monthly_price: plan.monthly_price,
          annual_price: plan.annual_price,
          max_projects: plan.max_projects,
          max_copies: plan.max_copies,
          copy_ai_enabled: plan.copy_ai_enabled,
          credits_per_month: plan.credits_per_month,
          rollover_enabled: plan.rollover_enabled,
          rollover_percentage: plan.rollover_percentage,
        },
        billing_cycle: data.billing_cycle as 'monthly' | 'annual' | 'free',
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        projects_count: data.projects_count,
        copies_count: data.copies_count,
        current_max_projects: data.current_max_projects,
        current_max_copies: data.current_max_copies,
        current_copy_ai_enabled: data.current_copy_ai_enabled,
        plan_offer_id: data.plan_offer_id,
      };
    },
    enabled: !!workspaceId,
  });
};
