import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TictoWebhookPayload, WebhookHeaders } from "@/types/database";

export interface PaymentTransaction {
  id: string;
  integration_slug: string;
  event_type: string;
  status: 'success' | 'failed' | 'processing' | 'received';
  created_at: string;
  processed_at?: string;
  paid_amount: number;
  offer_id: string;
  offer_name: string;
  workspace_id?: string;
  workspace_name?: string;
  owner_name?: string;
  owner_email?: string;
  payload: TictoWebhookPayload;
  headers?: WebhookHeaders;
  error_message?: string;
}

interface UsePaymentTransactionsParams {
  gateway?: string;
  status?: string;
  workspaceId?: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const usePaymentTransactions = (params?: UsePaymentTransactionsParams) => {
  const { gateway, status, workspaceId, limit = 100, startDate, endDate } = params || {};

  return useQuery({
    queryKey: ['payment-transactions', gateway, status, workspaceId, limit, startDate, endDate],
    // Executa sempre - datas são opcionais para "Todo o tempo"
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    queryFn: async (): Promise<PaymentTransaction[]> => {
      try {
        let query = supabase
          .from('webhook_logs')
          .select('*')
          .eq('event_category', 'payment')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (gateway) {
          query = query.eq('integration_slug', gateway);
        }

        if (status) {
          query = query.eq('status', status);
        }

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching payment transactions:', error);
          throw error;
        }

        if (!data) {
          return [];
        }

      // Extrair todos os workspace_ids únicos
      const workspaceIds = [...new Set(
        data
          .map(log => {
            const payload = log.payload as TictoWebhookPayload;
            return payload?.query_params?.workspace_id || payload?.url_params?.workspace_id;
          })
          .filter(Boolean)
      )] as string[];

      // Buscar todos os workspaces de uma vez (batch query)
      const { data: workspacesData } = await supabase
        .from('workspaces')
        .select('id, name')
        .in('id', workspaceIds);

      // Buscar todos os owners de uma vez (batch query) usando basic_profiles VIEW
      const { data: membersData } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          profiles:basic_profiles!workspace_members_user_id_fkey(
            name,
            email
          )
        `)
        .in('workspace_id', workspaceIds)
        .eq('role', 'owner');

      // Criar mapas para lookup rápido
      const workspaceMap = new Map(
        workspacesData?.map(w => [w.id, w.name]) || []
      );

      const ownerMap = new Map(
        membersData?.map(m => {
          const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
          return [
            m.workspace_id,
            { name: profile?.name, email: profile?.email }
          ];
        }) || []
      );

      // Enriquecer dados usando os mapas (muito mais rápido)
      const enrichedData = data.map((log) => {
        const payload = log.payload as TictoWebhookPayload;
        const workspaceIdFromPayload = payload?.query_params?.workspace_id || payload?.url_params?.workspace_id;
        
        const workspaceName = workspaceIdFromPayload ? workspaceMap.get(workspaceIdFromPayload) : undefined;
        const owner = workspaceIdFromPayload ? ownerMap.get(workspaceIdFromPayload) : undefined;

        return {
          id: log.id,
          integration_slug: log.integration_slug,
          event_type: log.event_type,
          status: log.status as 'success' | 'failed' | 'processing' | 'received',
          created_at: log.created_at,
          processed_at: log.processed_at || undefined,
          paid_amount: parseFloat(payload?.order?.paid_amount || '0') / 100,
          offer_id: payload?.item?.offer_id || '',
          offer_name: payload?.item?.offer_name || '',
          workspace_id: workspaceIdFromPayload,
          workspace_name: workspaceName,
          owner_name: owner?.name,
          owner_email: owner?.email,
          payload: payload,
          headers: log.headers as WebhookHeaders | undefined,
          error_message: log.error_message || undefined,
        } as PaymentTransaction;
      });

      // Filtrar por workspace se especificado
      if (workspaceId) {
        return enrichedData.filter(t => t.workspace_id === workspaceId);
      }

      return enrichedData;
    } catch (error) {
      console.error('Fatal error in payment transactions query:', error);
      throw error;
    }
  },
});
};

export const usePaymentTransactionsSummary = (params?: { startDate?: string; endDate?: string }) => {
  const { startDate, endDate } = params || {};
  
  return useQuery({
    queryKey: ['payment-transactions-summary', startDate, endDate],
    // Executa sempre - datas são opcionais para "Todo o tempo"
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    queryFn: async () => {
      try {
        let query = supabase
          .from('webhook_logs')
          .select('status, payload')
          .eq('event_category', 'payment');

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching summary:', error);
          throw error;
        }

        if (!data) {
          return {
            total: 0,
            successCount: 0,
            failedCount: 0,
            processingCount: 0,
            totalAmount: 0,
            successRate: 0,
          };
        }

        const total = data.length;
        const successCount = data.filter(d => d.status === 'success').length;
        const failedCount = data.filter(d => d.status === 'failed').length;
        const processingCount = data.filter(d => d.status === 'processing').length;
        
        const totalAmount = data
          .filter(d => d.status === 'success')
          .reduce((acc, curr) => {
            const payload = curr.payload as TictoWebhookPayload;
            const amount = parseFloat(payload?.order?.paid_amount || '0') / 100; // Converter centavos para reais
            return acc + amount;
          }, 0);

        return {
          total,
          successCount,
          failedCount,
          processingCount,
          totalAmount,
          successRate: total > 0 ? (successCount / total) * 100 : 0,
        };
      } catch (error) {
        console.error('Fatal error in payment transactions summary:', error);
        throw error;
      }
    },
  });
};
