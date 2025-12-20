import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Integration {
  id: string;
  name: string;
  slug: string;
}

interface PaymentGateway {
  id: string;
  integration_id: string;
  is_active: boolean;
  integrations: Integration;
}

export const useActivePaymentGateways = () => {
  return useQuery({
    queryKey: ['active-payment-gateways'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select(`
          id,
          integration_id,
          is_active,
          integrations!fk_gateways_integration (
            id,
            name,
            slug
          )
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching payment gateways:', error);
        throw error;
      }

      return (data || []) as PaymentGateway[];
    },
  });
};
