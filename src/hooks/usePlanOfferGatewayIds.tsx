import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlanOfferGatewayId {
  id: string;
  plan_offer_id: string;
  gateway_offer_id: string;
  description: string | null;
  created_at: string;
}

export function usePlanOfferGatewayIds(planOfferId: string | null) {
  const [gatewayIds, setGatewayIds] = useState<PlanOfferGatewayId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (planOfferId) {
      fetchGatewayIds();
    } else {
      setGatewayIds([]);
    }
  }, [planOfferId]);

  async function fetchGatewayIds() {
    if (!planOfferId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_offer_gateway_ids')
        .select('*')
        .eq('plan_offer_id', planOfferId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGatewayIds(data || []);
    } catch (error) {
      console.error('Erro ao buscar gateway IDs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addGatewayId(gatewayOfferId: string, description?: string) {
    if (!planOfferId) {
      toast.error('Salve a oferta primeiro antes de adicionar IDs');
      return false;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('plan_offer_gateway_ids')
        .insert({
          plan_offer_id: planOfferId,
          gateway_offer_id: gatewayOfferId,
          description: description || null
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este ID do gateway já está cadastrado em outra oferta');
        } else {
          throw error;
        }
        return false;
      }

      toast.success('ID do gateway adicionado');
      await fetchGatewayIds();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar gateway ID:', error);
      toast.error('Erro ao adicionar ID do gateway');
      return false;
    } finally {
      setIsAdding(false);
    }
  }

  async function removeGatewayId(id: string) {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('plan_offer_gateway_ids')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('ID do gateway removido');
      await fetchGatewayIds();
      return true;
    } catch (error) {
      console.error('Erro ao remover gateway ID:', error);
      toast.error('Erro ao remover ID do gateway');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    gatewayIds,
    isLoading,
    isAdding,
    isDeleting,
    addGatewayId,
    removeGatewayId,
    refetch: fetchGatewayIds
  };
}
