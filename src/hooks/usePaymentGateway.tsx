import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentGatewayConfig {
  id: string;
  integration_id: string;
  workspace_id: string | null;
  is_active: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  integration_slug: string;
  event_type: string;
  payload: any;
  headers: any;
  status: string;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export const usePaymentGateway = (integrationSlug: string) => {
  const queryClient = useQueryClient();

  // Buscar configuração do gateway
  const { data: config, isLoading } = useQuery({
    queryKey: ['payment-gateway-config', integrationSlug],
    queryFn: async (): Promise<PaymentGatewayConfig | null> => {
      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', integrationSlug)
        .single();

      if (!integration) return null;

      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('integration_id', integration.id)
        .is('workspace_id', null)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching gateway config:', error);
        return null;
      }

      return data;
    },
  });

  // Buscar logs de webhook
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['webhook-logs', integrationSlug],
    queryFn: async (): Promise<WebhookLog[]> => {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('integration_slug', integrationSlug)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching webhook logs:', error);
        return [];
      }

      return data || [];
    },
  });

  // Salvar configuração
  const saveConfig = useMutation({
    mutationFn: async ({ config: gatewayConfig, isActive }: { config: any; isActive: boolean }) => {
      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', integrationSlug)
        .single();

      if (!integration) {
        throw new Error('Integração não encontrada');
      }

      const { data: existingConfig } = await supabase
        .from('payment_gateways')
        .select('id')
        .eq('integration_id', integration.id)
        .is('workspace_id', null)
        .single();

      if (existingConfig) {
        // Update
        const { error } = await supabase
          .from('payment_gateways')
          .update({
            config: gatewayConfig,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('payment_gateways')
          .insert({
            integration_id: integration.id,
            workspace_id: null,
            config: gatewayConfig,
            is_active: isActive,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-gateway-config', integrationSlug] });
      queryClient.invalidateQueries({ queryKey: ['active-payment-gateways'] });
      toast.success('Configuração salva com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configuração: ' + error.message);
    },
  });

  // Testar conexão
  const testConnection = useMutation({
    mutationFn: async (validationToken: string) => {
      const { data, error } = await supabase.rpc('test_ticto_connection', {
        p_validation_token: validationToken,
      });

      if (error) throw error;

      return data as { success: boolean; message: string };
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao testar conexão: ' + error.message);
    },
  });

  return {
    config,
    isLoading,
    logs,
    logsLoading,
    saveConfig,
    testConnection,
  };
};
