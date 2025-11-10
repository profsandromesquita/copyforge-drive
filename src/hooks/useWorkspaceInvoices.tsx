import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkspaceInvoice {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  invoice_number: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  currency: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  payment_id: string | null;
  line_items: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useWorkspaceInvoices = (workspaceId: string) => {
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['workspace-invoices', workspaceId],
    queryFn: async (): Promise<WorkspaceInvoice[]> => {
      const { data, error } = await supabase
        .from('workspace_invoices')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workspace invoices:', error);
        throw error;
      }

      return data as WorkspaceInvoice[];
    },
    enabled: !!workspaceId,
  });

  const markAsPaid = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('workspace_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      toast.success('Fatura marcada como paga');
    },
    onError: (error) => {
      console.error('Error marking invoice as paid:', error);
      toast.error('Erro ao marcar fatura como paga');
    },
  });

  const cancelInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('workspace_invoices')
        .update({ status: 'cancelled' })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-invoices', workspaceId] });
      toast.success('Fatura cancelada');
    },
    onError: (error) => {
      console.error('Error cancelling invoice:', error);
      toast.error('Erro ao cancelar fatura');
    },
  });

  return {
    invoices: invoices || [],
    isLoading,
    markAsPaid,
    cancelInvoice,
  };
};
