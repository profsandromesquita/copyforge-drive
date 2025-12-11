import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Interface for public plan offer (excludes sensitive gateway data)
export interface PublicPlanOffer {
  id: string;
  plan_id: string;
  name: string;
  price: number;
  billing_period_value: number;
  billing_period_unit: string;
  checkout_url: string;
  is_active: boolean | null;
  display_order: number | null;
}

// Hook para buscar ofertas ativas de múltiplos planos (para página pública)
export const usePlanOffersPublic = (planIds: string[]) => {
  return useQuery({
    queryKey: ['plan-offers-public', planIds],
    queryFn: async () => {
      if (planIds.length === 0) return {};

      // Use public_plan_offers view instead of plan_offers table
      const { data, error } = await supabase
        .from('public_plan_offers')
        .select('id, plan_id, name, price, billing_period_value, billing_period_unit, checkout_url, is_active, display_order')
        .in('plan_id', planIds)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching public plan offers:', error);
        throw error;
      }

      // Agrupar ofertas por plan_id
      const offersByPlan: Record<string, PublicPlanOffer[]> = {};
      data?.forEach((offer) => {
        const planId = offer.plan_id;
        if (planId) {
          if (!offersByPlan[planId]) {
            offersByPlan[planId] = [];
          }
          offersByPlan[planId].push(offer as PublicPlanOffer);
        }
      });

      return offersByPlan;
    },
    enabled: planIds.length > 0,
  });
};
