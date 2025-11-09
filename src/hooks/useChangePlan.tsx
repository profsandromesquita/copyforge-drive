import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface ChangePlanParams {
  workspaceId: string;
  newPlanId: string;
  billingCycle: 'monthly' | 'annual';
}

interface ChangePlanResponse {
  success: boolean;
  error?: string;
  current_count?: number;
  new_limit?: number;
  new_subscription_id?: string;
  requires_payment?: boolean;
  amount_to_pay?: number;
  message?: string;
}

export const useChangePlan = () => {
  const queryClient = useQueryClient();

  const changePlan = useMutation({
    mutationFn: async ({ workspaceId, newPlanId, billingCycle }: ChangePlanParams) => {
      const { data, error } = await supabase.rpc('change_workspace_plan', {
        p_workspace_id: workspaceId,
        p_new_plan_id: newPlanId,
        p_new_billing_cycle: billingCycle,
      });

      if (error) throw error;
      return data as unknown as ChangePlanResponse;
    },
    onSuccess: (data) => {
      if (!data.success) {
        // Tratar erros específicos
        if (data.error === 'projects_limit_exceeded') {
          toast.error(
            `Você possui ${data.current_count} projetos, mas o plano selecionado permite apenas ${data.new_limit}. ` +
            `Por favor, arquive ou delete ${data.current_count! - data.new_limit!} projeto(s) antes de fazer o downgrade.`
          );
        } else if (data.error === 'copies_limit_exceeded') {
          toast.error(
            `Você possui ${data.current_count} copies, mas o plano selecionado permite apenas ${data.new_limit}. ` +
            `Por favor, delete ${data.current_count! - data.new_limit!} cop${data.current_count! - data.new_limit! > 1 ? 'ies' : 'y'} antes de continuar.`
          );
        } else if (data.error === 'unauthorized') {
          toast.error('Você não tem permissão para alterar o plano deste workspace.');
        } else if (data.error === 'no_active_subscription') {
          toast.error('Nenhuma assinatura ativa encontrada para este workspace.');
        } else if (data.error === 'plan_not_found') {
          toast.error('Plano selecionado não encontrado ou não está ativo.');
        } else {
          toast.error('Erro ao alterar plano. Tente novamente.');
        }
        return;
      }

      if (data.requires_payment) {
        // TODO: Redirecionar para gateway de pagamento
        toast.info('Preparando checkout para pagamento...', {
          description: `Valor a pagar: ${formatCurrency(data.amount_to_pay || 0)}`
        });
        
        // Quando integrar com gateway:
        // window.location.href = checkoutUrl;
      } else {
        toast.success(data.message || 'Plano alterado com sucesso!');
        
        // Invalidar queries para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['workspace-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['workspace-plan'] });
        queryClient.invalidateQueries({ queryKey: ['workspace-credits'] });
      }
    },
    onError: (error: any) => {
      console.error('Error changing plan:', error);
      toast.error(error.message || 'Erro ao alterar plano. Tente novamente.');
    },
  });

  return { 
    changePlan: changePlan.mutate,
    isChanging: changePlan.isPending,
  };
};
