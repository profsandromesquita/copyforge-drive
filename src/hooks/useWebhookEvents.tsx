import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TictoWebhookPayload, WebhookHeaders } from "@/types/database";

export interface WebhookEvent {
  id: string;
  integration_slug: string;
  event_type: string;
  event_category: string;
  status: string;
  error_message?: string;
  payload: TictoWebhookPayload;
  headers: WebhookHeaders | null;
  created_at: string;
  processed_at?: string;
}

interface UseWebhookEventsParams {
  integrationSlug?: string;
  eventCategory?: string;
  status?: string;
  limit?: number;
}

export const useWebhookEvents = (params?: UseWebhookEventsParams) => {
  const { integrationSlug, eventCategory, status, limit = 50 } = params || {};

  return useQuery({
    queryKey: ['webhook-events', integrationSlug, eventCategory, status, limit],
    queryFn: async (): Promise<WebhookEvent[]> => {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (integrationSlug) {
        query = query.eq('integration_slug', integrationSlug);
      }

      if (eventCategory) {
        query = query.eq('event_category', eventCategory);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching webhook events:', error);
        throw error;
      }

      return data as WebhookEvent[];
    },
  });
};

export const useWebhookEventsSummary = (integrationSlug?: string) => {
  return useQuery({
    queryKey: ['webhook-events-summary', integrationSlug],
    queryFn: async () => {
      let query = supabase
        .from('webhook_events_summary')
        .select('*');

      if (integrationSlug) {
        query = query.eq('integration_slug', integrationSlug);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching webhook events summary:', error);
        throw error;
      }

      return data;
    },
  });
};

// Mapeamento de eventos para nomes amigáveis
export const getEventDisplayName = (eventType: string): string => {
  const eventNames: Record<string, string> = {
    'purchase.approved': 'Venda Aprovada',
    'payment.chargeback': 'Chargeback',
    'payment.refunded': 'Reembolso',
    'payment.pending': 'Aguardando Pagamento',
    'payment.refused': 'Pagamento Recusado',
    'bank_slip.created': 'Boleto Criado',
    'bank_slip.delayed': 'Boleto Atrasado',
    'pix.created': 'Pix Gerado',
    'pix.expired': 'Pix Expirado',
    'subscription.cancelled': 'Assinatura Cancelada',
    'subscription.card_updated': 'Cartão Atualizado',
    'subscription.trial_started': 'Trial Iniciado',
    'subscription.trial_ended': 'Trial Encerrado',
    'subscription.resumed': 'Assinatura Retomada',
    'subscription.past_due': 'Pagamento Atrasado',
    'subscription.extended': 'Assinatura Extendida',
    'subscription.ended': 'Assinatura Encerrada',
    'cart.abandoned': 'Carrinho Abandonado',
    'trial.active': 'Trial Ativo',
    'order.closed': 'Pedido Fechado',
  };

  return eventNames[eventType] || eventType;
};

// Mapeamento de categorias para cores
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'payment': 'bg-green-500',
    'refund': 'bg-red-500',
    'subscription': 'bg-blue-500',
    'trial': 'bg-purple-500',
    'tracking': 'bg-yellow-500',
    'order': 'bg-gray-500',
    'unknown': 'bg-gray-400',
  };

  return colors[category] || colors.unknown;
};

// Mapeamento de status para cores
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'success': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'processing': 'bg-yellow-100 text-yellow-800',
    'received': 'bg-blue-100 text-blue-800',
  };

  return colors[status] || colors.received;
};
