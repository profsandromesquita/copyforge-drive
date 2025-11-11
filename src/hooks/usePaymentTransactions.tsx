import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  payload: any;
  headers?: any;
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
    enabled: !!startDate && !!endDate, // Só executa quando as datas estiverem definidas
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

      // Enriquecer dados com informações de workspace e proprietário
      const enrichedData = await Promise.all(
        data.map(async (log) => {
          try {
            const payload = log.payload as any;
            // Ticto envia em query_params (v2.0) ou url_params (legado)
            const workspaceIdFromPayload = payload?.query_params?.workspace_id || payload?.url_params?.workspace_id;
            
            let workspaceName, ownerName, ownerEmail;

            if (workspaceIdFromPayload) {
              // Buscar workspace
              const { data: workspace } = await supabase
                .from('workspaces')
                .select('name')
                .eq('id', workspaceIdFromPayload)
                .single();

              workspaceName = workspace?.name;

              // Buscar owner do workspace
              const { data: member } = await supabase
                .from('workspace_members')
                .select(`
                  profiles!workspace_members_user_id_fkey(
                    name,
                    email
                  )
                `)
                .eq('workspace_id', workspaceIdFromPayload)
                .eq('role', 'owner')
                .single();

              if (member && member.profiles) {
                const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                ownerName = profile?.name;
                ownerEmail = profile?.email;
              }
            }

            return {
              id: log.id,
              integration_slug: log.integration_slug,
              event_type: log.event_type,
              status: log.status as 'success' | 'failed' | 'processing' | 'received',
              created_at: log.created_at,
              processed_at: log.processed_at,
              paid_amount: parseFloat(payload?.order?.paid_amount || '0') / 100, // Converter centavos para reais
              offer_id: payload?.item?.offer_id || '',
              offer_name: payload?.item?.offer_name || '',
              workspace_id: workspaceIdFromPayload,
              workspace_name: workspaceName,
              owner_name: ownerName,
              owner_email: ownerEmail,
              payload: log.payload,
              headers: log.headers,
              error_message: log.error_message,
            };
          } catch (error) {
            console.error('Error enriching transaction data:', error);
            // Retornar dados básicos se houver erro
            const payload = log.payload as any;
            return {
              id: log.id,
              integration_slug: log.integration_slug,
              event_type: log.event_type,
              status: log.status as 'success' | 'failed' | 'processing' | 'received',
              created_at: log.created_at,
              processed_at: log.processed_at,
              paid_amount: parseFloat(payload?.order?.paid_amount || '0') / 100,
              offer_id: payload?.item?.offer_id || '',
              offer_name: payload?.item?.offer_name || '',
              workspace_id: undefined,
              workspace_name: undefined,
              owner_name: undefined,
              owner_email: undefined,
              payload: log.payload,
              headers: log.headers,
              error_message: log.error_message,
            };
          }
        })
      );

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
    enabled: !!startDate && !!endDate, // Só executa quando as datas estiverem definidas
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
            const payload = curr.payload as any;
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
