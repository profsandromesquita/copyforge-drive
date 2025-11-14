import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModelRoutingConfig {
  id: string;
  copy_type: string;
  copy_type_label: string;
  default_model: string;
  available_models: string[];
  description: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export const useModelRouting = () => {
  const queryClient = useQueryClient();

  // Buscar todas as configurações
  const { data: routingConfigs, isLoading } = useQuery({
    queryKey: ['model-routing-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_routing_config')
        .select('*')
        .order('copy_type');
      
      if (error) throw error;
      return data as ModelRoutingConfig[];
    }
  });

  // Atualizar configuração
  const updateRoutingMutation = useMutation({
    mutationFn: async ({ copyType, newModel }: { copyType: string; newModel: string }) => {
      const { data, error } = await supabase
        .from('model_routing_config')
        .update({ 
          default_model: newModel,
          updated_at: new Date().toISOString()
        })
        .eq('copy_type', copyType)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-routing-config'] });
      toast.success('Configuração de roteamento atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar roteamento:', error);
      toast.error('Erro ao atualizar configuração de roteamento');
    }
  });

  return {
    routingConfigs,
    isLoading,
    updateRouting: updateRoutingMutation.mutate,
    isUpdating: updateRoutingMutation.isPending
  };
};
