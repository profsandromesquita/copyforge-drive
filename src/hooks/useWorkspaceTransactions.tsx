import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./useWorkspace";

export interface CreditTransaction {
  id: string;
  created_at: string;
  transaction_type: 'debit' | 'credit';
  amount: number;
  balance_before: number;
  balance_after: number;
  model_used?: string;
  tokens_used?: number;
  input_tokens?: number;
  output_tokens?: number;
  tpc_snapshot?: number;
  multiplier_snapshot?: number;
  cost_limit_snapshot?: number;
  generation_id?: string;
  description?: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface UseWorkspaceTransactionsParams {
  type?: 'debit' | 'credit' | 'all';
  userId?: string;
  model?: string;
  limit?: number;
}

export const useWorkspaceTransactions = (params?: UseWorkspaceTransactionsParams) => {
  const { activeWorkspace } = useWorkspace();
  const { type = 'all', userId, model, limit = 100 } = params || {};

  return useQuery({
    queryKey: ['workspace-transactions', activeWorkspace?.id, type, userId, model, limit],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from('credit_transactions')
        .select(`
          *,
          user:profiles!credit_transactions_user_id_fkey(
            name,
            email,
            avatar_url
          )
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type !== 'all') {
        query = query.eq('transaction_type', type);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (model) {
        query = query.eq('model_used', model);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching workspace transactions:', error);
        throw error;
      }

      return data.map(tx => ({
        ...tx,
        user: Array.isArray(tx.user) ? tx.user[0] : tx.user
      })) as CreditTransaction[];
    },
    enabled: !!activeWorkspace?.id,
  });
};
