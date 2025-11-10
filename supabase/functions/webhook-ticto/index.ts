import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ticto-signature',
};

interface TictoWebhookPayload {
  event: string;
  data: {
    id: string;
    offer_id: string;
    customer: {
      email: string;
      name: string;
    };
    amount: number;
    status: string;
    created_at?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Responder a requisições GET (validação de URL pela Ticto)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook Ticto ativo e pronto para receber eventos',
        timestamp: new Date().toISOString(),
        status: 'ready'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let logId: string | null = null;

  try {
    // Tentar parsear o body - se falhar, ainda processar a requisição
    let payload: TictoWebhookPayload;
    let headers: Record<string, string>;
    
    try {
      const bodyText = await req.text();
      headers = Object.fromEntries(req.headers.entries());
      
      console.log('Webhook recebido - Body:', bodyText);
      console.log('Webhook recebido - Headers:', headers);
      
      // Se não houver body, criar um payload vazio de validação
      if (!bodyText || bodyText.trim() === '') {
        payload = {
          event: 'validation',
          data: {
            id: 'validation',
            offer_id: '',
            customer: { email: '', name: '' },
            amount: 0,
            status: 'validation'
          }
        };
      } else {
        payload = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.error('Erro ao parsear payload:', parseError);
      // Se falhar ao parsear, criar payload de validação
      headers = Object.fromEntries(req.headers.entries());
      payload = {
        event: 'validation',
        data: {
          id: 'validation',
          offer_id: '',
          customer: { email: '', name: '' },
          amount: 0,
          status: 'validation'
        }
      };
    }
    
    console.log('Webhook recebido:', payload.event);
    
    // Log inicial do webhook
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        integration_slug: 'ticto',
        event_type: payload.event,
        payload: payload,
        headers: headers,
        status: 'received'
      })
      .select()
      .single();

    if (logError) {
      console.error('Erro ao criar log:', logError);
    } else {
      logId = logData?.id;
    }

    // Se for um evento de teste/validação, retornar sucesso sem verificar configuração
    console.log('Verificando tipo de evento:', payload.event);
    if (payload.event === 'test' || payload.event === 'ping' || payload.event === 'webhook.test' || payload.event === 'validation') {
      console.log('Evento de teste/validação detectado, retornando sucesso');
      if (logId) {
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'success',
            processed_at: new Date().toISOString()
          })
          .eq('id', logId);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook endpoint is working', event: payload.event }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Buscar configuração da Ticto para eventos reais
    console.log('Buscando configuração da Ticto');
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('slug', 'ticto')
      .single();

    if (!integration) {
      throw new Error('Integração Ticto não encontrada');
    }

    const { data: gateway } = await supabase
      .from('payment_gateways')
      .select('config, is_active')
      .eq('integration_id', integration.id)
      .is('workspace_id', null)
      .single();

    console.log('Gateway encontrado:', gateway ? 'sim' : 'não', 'Ativo:', gateway?.is_active);

    if (!gateway || !gateway.is_active) {
      throw new Error('Gateway Ticto não está configurado ou ativo');
    }

    // Validar token
    const validationToken = headers['x-ticto-signature'] || headers['authorization'];
    if (validationToken && validationToken !== gateway.config.validation_token) {
      throw new Error('Token de validação inválido');
    }

    // Atualizar log para processing
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'processing' })
        .eq('id', logId);
    }

    // Processar evento
    let result;
    switch (payload.event) {
      case 'purchase.approved':
      case 'subscription.created':
        result = await handleSubscriptionCreated(supabase, payload, gateway.config);
        break;
      case 'subscription.canceled':
      case 'subscription.cancelled':
        result = await handleSubscriptionCanceled(supabase, payload);
        break;
      default:
        console.log(`Evento não tratado: ${payload.event}`);
        result = { status: 'ignored', event: payload.event };
    }

    // Atualizar log como sucesso
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({ 
          status: 'success',
          processed_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao processar webhook:', error);
    
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({ 
          status: 'failed',
          error_message: errorMessage,
          processed_at: new Date().toISOString()
        })
        .eq('id', logId);
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handleSubscriptionCreated(supabase: any, payload: TictoWebhookPayload, config: any) {
  const offerId = payload.data.offer_id;
  const planId = config.offer_mappings?.[offerId];
  
  if (!planId) {
    throw new Error(`Oferta ${offerId} não mapeada para nenhum plano`);
  }

  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError || !plan) {
    throw new Error(`Plano ${planId} não encontrado`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', payload.data.customer.email)
    .single();

  if (!profile) {
    throw new Error(`Usuário ${payload.data.customer.email} não encontrado no sistema`);
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', profile.id)
    .eq('role', 'owner')
    .single();

  if (!member) {
    throw new Error(`Workspace não encontrado para usuário ${profile.id}`);
  }

  // Cancelar assinatura antiga se existir
  const { data: existingSubscription } = await supabase
    .from('workspace_subscriptions')
    .select('id')
    .eq('workspace_id', member.workspace_id)
    .eq('status', 'active')
    .single();

  if (existingSubscription) {
    await supabase
      .from('workspace_subscriptions')
      .update({ 
        status: 'cancelled', 
        cancelled_at: new Date().toISOString() 
      })
      .eq('id', existingSubscription.id);
  }

  // Determinar ciclo de cobrança
  const billingCycle = payload.data.amount === plan.monthly_price ? 'monthly' : 'annual';
  const periodMonths = billingCycle === 'monthly' ? 1 : 12;
  
  // Criar nova assinatura
  await supabase
    .from('workspace_subscriptions')
    .insert({
      workspace_id: member.workspace_id,
      plan_id: planId,
      billing_cycle: billingCycle,
      status: 'active',
      current_max_projects: plan.max_projects,
      current_max_copies: plan.max_copies,
      current_copy_ai_enabled: plan.copy_ai_enabled,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + periodMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_gateway: 'ticto',
      external_subscription_id: payload.data.id
    });

  // Adicionar créditos do plano
  const { data: credits } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', member.workspace_id)
    .single();

  if (credits) {
    await supabase
      .from('workspace_credits')
      .update({
        balance: credits.balance + plan.credits_per_month,
        total_added: credits.balance + plan.credits_per_month
      })
      .eq('workspace_id', member.workspace_id);
  }

  // Registrar transação de crédito
  await supabase
    .from('credit_transactions')
    .insert({
      workspace_id: member.workspace_id,
      user_id: profile.id,
      transaction_type: 'credit',
      amount: plan.credits_per_month,
      balance_before: credits?.balance || 0,
      balance_after: (credits?.balance || 0) + plan.credits_per_month,
      description: `Créditos do plano ${plan.name} - Pagamento Ticto`
    });

  return { 
    status: 'subscription_created', 
    workspace_id: member.workspace_id,
    plan: plan.name,
    credits_added: plan.credits_per_month
  };
}

async function handleSubscriptionCanceled(supabase: any, payload: TictoWebhookPayload) {
  const { data: subscription } = await supabase
    .from('workspace_subscriptions')
    .select('id, workspace_id')
    .eq('external_subscription_id', payload.data.id)
    .eq('payment_gateway', 'ticto')
    .single();

  if (subscription) {
    await supabase
      .from('workspace_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    return { 
      status: 'subscription_cancelled', 
      workspace_id: subscription.workspace_id 
    };
  }

  return { status: 'subscription_not_found' };
}
