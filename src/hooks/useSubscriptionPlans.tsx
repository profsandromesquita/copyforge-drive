import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** @deprecated Use plan_offers table instead */
  monthly_price: number;
  /** @deprecated Use plan_offers table instead */
  annual_price: number;
  max_projects: number | null;
  max_copies: number | null;
  copy_ai_enabled: boolean;
  credits_per_month: number;
  rollover_enabled: boolean;
  rollover_percentage: number;
  rollover_days: number;
  is_active: boolean;
  display_order: number;
  payment_gateway_id: string | null;
  /** @deprecated Use plan_offers table instead */
  checkout_url_monthly: string | null;
  /** @deprecated Use plan_offers table instead */
  checkout_url_annual: string | null;
  /** @deprecated Use plan_offers table instead */
  uses_legacy_pricing?: boolean;
  created_at: string;
  updated_at: string;
}

export const useSubscriptionPlans = () => {
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    }
  });

  const createPlan = useMutation({
    mutationFn: async (plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([plan])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano criado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar plano: ${error.message}`);
    }
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano atualizado com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar plano: ${error.message}`);
    }
  });

  const togglePlanStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Status do plano atualizado');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    }
  });

  return {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    togglePlanStatus
  };
};
