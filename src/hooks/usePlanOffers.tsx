import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlanOffer {
  id: string;
  plan_id: string;
  payment_gateway_id: string;
  name: string;
  price: number;
  billing_period_value: number;
  billing_period_unit: 'days' | 'months' | 'years' | 'lifetime';
  gateway_offer_id: string;
  checkout_url: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlanOfferFormData {
  plan_id: string;
  payment_gateway_id: string;
  name: string;
  price: number;
  billing_period_value: number;
  billing_period_unit: 'days' | 'months' | 'years' | 'lifetime';
  gateway_offer_id: string;
  checkout_url: string;
  display_order: number;
}

export const usePlanOffers = (planId?: string) => {
  const queryClient = useQueryClient();

  // Buscar ofertas de um plano específico
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['plan-offers', planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('plan_offers')
        .select('*')
        .eq('plan_id', planId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching plan offers:', error);
        throw error;
      }

      return data as PlanOffer[];
    },
    enabled: !!planId,
  });

  // Buscar ofertas ativas de um plano
  const { data: activeOffers = [] } = useQuery({
    queryKey: ['plan-offers-active', planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('plan_offers')
        .select('*')
        .eq('plan_id', planId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching active plan offers:', error);
        throw error;
      }

      return data as PlanOffer[];
    },
    enabled: !!planId,
  });

  // Criar oferta
  const createOffer = useMutation({
    mutationFn: async (offerData: PlanOfferFormData) => {
      const { data, error } = await supabase
        .from('plan_offers')
        .insert(offerData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-offers'] });
      toast.success('Oferta criada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error creating offer:', error);
      toast.error(error.message || 'Erro ao criar oferta');
    },
  });

  // Atualizar oferta
  const updateOffer = useMutation({
    mutationFn: async ({ id, ...offerData }: Partial<PlanOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from('plan_offers')
        .update(offerData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-offers'] });
      toast.success('Oferta atualizada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error updating offer:', error);
      toast.error(error.message || 'Erro ao atualizar oferta');
    },
  });

  // Deletar oferta
  const deleteOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('plan_offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-offers'] });
      toast.success('Oferta deletada com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error deleting offer:', error);
      toast.error(error.message || 'Erro ao deletar oferta');
    },
  });

  // Toggle status da oferta
  const toggleOfferStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('plan_offers')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-offers'] });
      toast.success('Status da oferta atualizado!');
    },
    onError: (error: any) => {
      console.error('Error toggling offer status:', error);
      toast.error(error.message || 'Erro ao atualizar status da oferta');
    },
  });

  return {
    offers,
    activeOffers,
    isLoading,
    createOffer: createOffer.mutate,
    updateOffer: updateOffer.mutate,
    deleteOffer: deleteOffer.mutate,
    toggleOfferStatus: toggleOfferStatus.mutate,
    isCreating: createOffer.isPending,
    isUpdating: updateOffer.isPending,
    isDeleting: deleteOffer.isPending,
    isToggling: toggleOfferStatus.isPending,
  };
};
