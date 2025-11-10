import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanOffer } from "./usePlanOffers";

// Hook para buscar ofertas ativas de múltiplos planos (para página pública)
export const usePlanOffersPublic = (planIds: string[]) => {
  return useQuery({
    queryKey: ['plan-offers-public', planIds],
    queryFn: async () => {
      if (planIds.length === 0) return {};

      const { data, error } = await supabase
        .from('plan_offers')
        .select('*')
        .in('plan_id', planIds)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching public plan offers:', error);
        throw error;
      }

      // Agrupar ofertas por plan_id
      const offersByPlan: Record<string, PlanOffer[]> = {};
      data.forEach((offer: any) => {
        if (!offersByPlan[offer.plan_id]) {
          offersByPlan[offer.plan_id] = [];
        }
        offersByPlan[offer.plan_id].push(offer as PlanOffer);
      });

      return offersByPlan;
    },
    enabled: planIds.length > 0,
  });
};
