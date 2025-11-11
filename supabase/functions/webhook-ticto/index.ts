import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ticto-signature',
};

// Interface baseada na documentação oficial da Ticto v2.0
interface TictoWebhookPayload {
  version: string;
  commission_type: string;
  status: string; // Campo principal para identificar o tipo de evento
  status_date: string;
  token: string;
  payment_method: string;
  url_params?: any;
  query_params?: any; // Ticto v2.0 envia params em query_params
  tracking?: any;
  checkout_url?: string;
  order: {
    id: number;
    hash: string;
    transaction_hash: string;
    paid_amount: number;
    installments: number;
    order_date: string;
  };
  shipping?: {
    amount: number;
    type: string;
    method: string;
    delivery_days: number;
  };
  offer?: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    price: number;
    is_subscription: boolean;
    interval: number;
    trial_days: number;
    first_charge_price: number | null;
  };
  item: {
    product_name: string;
    product_id: number;
    refund_deadline?: number;
    offer_name: string;
    offer_id: number;
    offer_code: string;
    coupon_id?: number | null;
    coupon_name?: string | null;
    quantity: number;
    amount: number;
    members_portal_id?: number | null;
    members_classroom_id?: number | null;
    days_of_access?: number | null;
    trial_days?: number | null;
  };
  subscriptions?: Array<{
    id: number;
    interval: number;
    successful_charges: number;
    failed_charges: number;
    change_card_url: string;
    max_charges: number | null;
    next_charge: string | null;
    canceled_at: string | null;
  }>;
  bumps?: Array<any>;
  transaction: {
    hash: string;
    cards?: Array<{
      brand: string;
      holder: string;
      first_digits: string;
      last_digits: string;
    }>;
    bank_slip_code?: string;
    bank_slip_url?: string;
    bank_slip_pdf?: string;
    pix_qr_code?: string;
  };
  customer: {
    cpf?: string;
    cnpj?: string;
    name: string;
    type: string;
    email: string;
    phone?: {
      ddd: string;
      ddi: string;
      number: string;
    };
    address?: {
      city?: string;
      state?: string;
      street?: string;
      country?: string;
      zip_code?: string;
      complement?: string;
      neighborhood?: string;
      street_number?: string;
    };
    is_foreign?: boolean;
    code: string;
  };
  producer?: any;
  affiliates?: Array<any>;
  coproducers?: Array<any>;
  marketplace_commission?: number;
  direct_login_url?: string;
}

interface EventResult {
  status: string;
  event_type: string;
  event_category: string;
  workspace_id?: string;
  message?: string;
  [key: string]: any;
}

// Função para identificar o tipo de evento baseado no status
function identifyEventType(payload: TictoWebhookPayload): { type: string; category: string } {
  const status = payload.status;
  
  // Mapeamento de status -> tipo de evento e categoria
  const eventMap: Record<string, { type: string; category: string }> = {
    // Pagamentos
    'authorized': { type: 'purchase.approved', category: 'payment' },
    'waiting_payment': { type: 'payment.pending', category: 'payment' },
    'refused': { type: 'payment.refused', category: 'payment' },
    'bank_slip_created': { type: 'bank_slip.created', category: 'payment' },
    'bank_slip_delayed': { type: 'bank_slip.delayed', category: 'payment' },
    'pix_created': { type: 'pix.created', category: 'payment' },
    'pix_expired': { type: 'pix.expired', category: 'payment' },
    
    // Reembolsos e problemas
    'chargeback': { type: 'payment.chargeback', category: 'refund' },
    'refunded': { type: 'payment.refunded', category: 'refund' },
    'claimed': { type: 'payment.claimed', category: 'refund' },
    
    // Assinaturas
    'subscription_canceled': { type: 'subscription.cancelled', category: 'subscription' },
    'card_exchanged': { type: 'subscription.card_updated', category: 'subscription' },
    'trial_started': { type: 'subscription.trial_started', category: 'subscription' },
    'trial_ended': { type: 'subscription.trial_ended', category: 'subscription' },
    'uncanceled': { type: 'subscription.resumed', category: 'subscription' },
    'subscription_delayed': { type: 'subscription.past_due', category: 'subscription' },
    'extended': { type: 'subscription.extended', category: 'subscription' },
    'all_charges_paid': { type: 'subscription.ended', category: 'subscription' },
    
    // Outros
    'abandoned_cart': { type: 'cart.abandoned', category: 'tracking' },
    'trial': { type: 'trial.active', category: 'trial' },
    'close': { type: 'order.closed', category: 'order' },
  };
  
  return eventMap[status] || { type: status, category: 'unknown' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook Ticto ativo - Versão 2.0',
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
    const bodyText = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log('📥 Webhook recebido da Ticto');
    console.log('Body:', bodyText);
    
    if (!bodyText || bodyText.trim() === '') {
      throw new Error('Payload vazio recebido');
    }

    const payload: TictoWebhookPayload = JSON.parse(bodyText);
    const { type: eventType, category: eventCategory } = identifyEventType(payload);
    
    console.log(`📋 Evento identificado: ${eventType} (${eventCategory})`);
    
    // Log inicial do webhook
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        integration_slug: 'ticto',
        event_type: eventType,
        event_category: eventCategory,
        payload: payload,
        headers: headers,
        status: 'received'
      })
      .select()
      .single();

    if (logError) {
      console.error('❌ Erro ao criar log:', logError);
    } else {
      logId = logData?.id;
      console.log(`✅ Log criado: ${logId}`);
    }

    // Buscar configuração da Ticto
    console.log('🔍 Buscando configuração da Ticto...');
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

    // Processar evento baseado no tipo identificado
    let result: EventResult;
    
    switch (eventType) {
      case 'purchase.approved':
        result = await handlePurchaseApproved(supabase, payload, gateway.config);
        break;
        
      case 'payment.chargeback':
        result = await handleChargeback(supabase, payload);
        break;
        
      case 'payment.refunded':
        result = await handleRefund(supabase, payload);
        break;
        
      case 'subscription.cancelled':
        result = await handleSubscriptionCancelled(supabase, payload);
        break;
        
      case 'subscription.card_updated':
        result = await handleCardUpdated(supabase, payload);
        break;
        
      case 'subscription.trial_started':
        result = await handleTrialStarted(supabase, payload, gateway.config);
        break;
        
      case 'subscription.trial_ended':
        result = await handleTrialEnded(supabase, payload, gateway.config);
        break;
        
      case 'subscription.resumed':
        result = await handleSubscriptionResumed(supabase, payload, gateway.config);
        break;
        
      case 'subscription.past_due':
        result = await handleSubscriptionPastDue(supabase, payload);
        break;
        
      case 'subscription.extended':
        result = await handleSubscriptionExtended(supabase, payload, gateway.config);
        break;
        
      case 'subscription.ended':
        result = await handleSubscriptionEnded(supabase, payload);
        break;
        
      default:
        console.log(`⚠️ Evento não tratado: ${eventType}`);
        result = {
          status: 'ignored',
          event_type: eventType,
          event_category: eventCategory,
          message: 'Evento recebido mas não processado'
        };
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

    console.log('✅ Webhook processado com sucesso');
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro ao processar webhook:', error);
    
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

// ========== FUNÇÕES AUXILIARES ==========

// Função para buscar o user_id do owner de um workspace
async function getWorkspaceOwnerId(supabase: any, workspaceId: string): Promise<string | null> {
  const { data: member } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('role', 'owner')
    .single();
  
  return member?.user_id || null;
}

// NOVAS FUNÇÕES AUXILIARES PARA PROCESSAMENTO DE WEBHOOKS

// Validar se workspace existe
async function validateWorkspaceExists(supabase: any, workspaceId: string): Promise<any | null> {
  console.log(`🔍 Validando se workspace ${workspaceId} existe...`);
  
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, created_by')
    .eq('id', workspaceId)
    .single();
  
  if (error || !workspace) {
    console.warn(`⚠️ Workspace ${workspaceId} não existe. Erro: ${error?.message}`);
    return null;
  }
  
  console.log(`✅ Workspace validado: ${workspace.name}`);
  return workspace;
}

// Buscar profile pelo email
async function findProfileByEmail(supabase: any, email: string): Promise<{ id: string; email: string; name: string } | null> {
  console.log(`🔍 Buscando profile pelo email: ${email}`);
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('email', email)
    .maybeSingle();
  
  if (error) {
    console.error(`❌ Erro ao buscar profile: ${error.message}`);
    return null;
  }
  
  if (profile) {
    console.log(`✅ Profile encontrado: ${profile.name} (${profile.id})`);
  } else {
    console.log(`⚠️ Profile não encontrado para email: ${email}`);
  }
  
  return profile;
}

// Criar usuário via webhook (para novos cadastros)
async function createUserFromWebhook(
  supabase: any,
  email: string,
  name: string
): Promise<{ userId: string; temporaryPassword: string }> {
  console.log(`👤 Criando novo usuário: ${email}`);
  
  // Gerar senha temporária forte
  const temporaryPassword = `Temp${Math.random().toString(36).slice(-8)}!${Date.now().toString(36)}`;
  
  try {
    // Criar usuário no auth.users usando Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        name: name,
        created_via: 'ticto_webhook'
      }
    });
    
    if (authError || !authUser.user) {
      throw new Error(`Erro ao criar usuário no auth: ${authError?.message}`);
    }
    
    console.log(`✅ Usuário criado no auth.users: ${authUser.user.id}`);
    
    // Criar profile no banco
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: email,
        name: name
      });
    
    if (profileError) {
      // Se profile já existe (criado por trigger), não é erro fatal
      console.warn(`⚠️ Profile pode já existir: ${profileError.message}`);
    } else {
      console.log(`✅ Profile criado no banco`);
    }
    
    return {
      userId: authUser.user.id,
      temporaryPassword: temporaryPassword
    };
    
  } catch (error) {
    console.error(`❌ Erro ao criar usuário:`, error);
    throw error;
  }
}

// Criar workspace para usuário
async function createWorkspaceForUser(
  supabase: any,
  userId: string,
  userName: string,
  plan: any,
  offer: any,
  payload: TictoWebhookPayload
): Promise<string> {
  console.log(`🏢 Criando workspace para usuário ${userId}...`);
  
  const workspaceName = `Workspace de ${userName}`;
  
  try {
    // Criar workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: workspaceName,
        created_by: userId,
        is_active: true
      })
      .select()
      .single();
    
    if (workspaceError || !workspace) {
      throw new Error(`Erro ao criar workspace: ${workspaceError?.message}`);
    }
    
    console.log(`✅ Workspace criado: ${workspace.id}`);
    
    // Adicionar membership como owner
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
        invited_by: userId
      });
    
    if (memberError) {
      // Se membership já existe (criado por trigger), não é erro fatal
      console.warn(`⚠️ Membership pode já existir: ${memberError.message}`);
    } else {
      console.log(`✅ Membership criado como owner`);
    }
    
    // Criar workspace_credits com saldo inicial
    const { error: creditsError } = await supabase
      .from('workspace_credits')
      .insert({
        workspace_id: workspace.id,
        balance: plan.credits_per_month,
        total_added: plan.credits_per_month
      });
    
    if (creditsError) {
      // Se credits já existe (criado por trigger), atualizar
      console.warn(`⚠️ Credits pode já existir, tentando atualizar: ${creditsError.message}`);
      await supabase
        .from('workspace_credits')
        .update({
          balance: plan.credits_per_month,
          total_added: plan.credits_per_month
        })
        .eq('workspace_id', workspace.id);
    } else {
      console.log(`✅ Créditos iniciais criados: ${plan.credits_per_month}`);
    }
    
    return workspace.id;
    
  } catch (error) {
    console.error(`❌ Erro ao criar workspace:`, error);
    throw error;
  }
}

// Enviar email de boas-vindas com link para criar senha
async function sendWelcomeEmailWithPasswordSetup(
  email: string,
  name: string,
  workspaceName: string,
  planName: string
): Promise<void> {
  console.log(`📧 Enviando email de boas-vindas para: ${email}`);
  
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY não configurada, email não será enviado');
    return;
  }
  
  try {
    const resetPasswordUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?type=recovery&token=`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao CopyDrive!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              
              <p>Sua compra foi confirmada com sucesso! Estamos muito felizes em tê-lo(a) conosco.</p>
              
              <h3>Detalhes da sua assinatura:</h3>
              <ul>
                <li><strong>Plano:</strong> ${planName}</li>
                <li><strong>Workspace:</strong> ${workspaceName}</li>
              </ul>
              
              <p>Para começar a usar o CopyDrive, você precisa criar sua senha de acesso:</p>
              
              <div style="text-align: center;">
                <a href="${resetPasswordUrl}" class="button">
                  🔐 Criar Minha Senha
                </a>
              </div>
              
              <p style="margin-top: 30px;">Após criar sua senha, você poderá acessar o dashboard e começar a criar suas copies!</p>
              
              <p>Se tiver qualquer dúvida, estamos aqui para ajudar.</p>
              
              <p>Boas vendas! 🚀</p>
              <p><strong>Equipe CopyDrive</strong></p>
            </div>
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'CopyDrive <onboarding@resend.dev>',
        to: [email],
        subject: `🎉 Bem-vindo ao CopyDrive - Plano ${planName} Ativado!`,
        html: emailHtml
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao enviar email: ${error}`);
    }
    
    console.log(`✅ Email de boas-vindas enviado com sucesso para ${email}`);
    
  } catch (error) {
    console.error(`❌ Erro ao enviar email:`, error);
    // Não lançar erro - email é secundário, não deve bloquear o webhook
  }
}

// Função para buscar oferta pelo gateway_offer_id da Ticto
async function findPlanOfferByGatewayId(
  supabase: any, 
  gatewayOfferId: string | number, 
  gatewayId: string
): Promise<any> {
  const { data: offer, error } = await supabase
    .from('plan_offers')
    .select('*, subscription_plans(*)')
    .eq('gateway_offer_id', gatewayOfferId.toString())
    .eq('payment_gateway_id', gatewayId)
    .eq('is_active', true)
    .single();
  
  if (error || !offer) {
    throw new Error(`Oferta ${gatewayOfferId} não encontrada ou não está ativa`);
  }
  
  return offer;
}

// Função para calcular período de fim baseado na oferta
function calculatePeriodEnd(offer: any): Date | null {
  const now = new Date();
  const value = offer.billing_period_value;
  const unit = offer.billing_period_unit;
  
  switch (unit) {
    case 'days':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    case 'months':
      const monthEnd = new Date(now);
      monthEnd.setMonth(monthEnd.getMonth() + value);
      return monthEnd;
    case 'years':
      const yearEnd = new Date(now);
      yearEnd.setFullYear(yearEnd.getFullYear() + value);
      return yearEnd;
    case 'lifetime':
      return null;
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // fallback 30 dias
  }
}

// Função para determinar billing_cycle baseado na oferta
function determineBillingCycle(offer: any): string {
  const value = offer.billing_period_value;
  const unit = offer.billing_period_unit;
  
  if (value === 1 && unit === 'months') return 'monthly';
  if (value === 12 && unit === 'months') return 'annual';
  return 'monthly'; // padrão
}

// ========== HANDLERS DE EVENTOS ==========

// 1. Venda Aprovada / Pagamento Confirmado
async function handlePurchaseApproved(supabase: any, payload: TictoWebhookPayload, config: any): Promise<EventResult> {
  console.log('💰 Processando venda aprovada...');
  
  // ============= VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  const orderHash = payload.order.hash;
  const transactionHash = payload.order.transaction_hash;
  
  console.log('🔍 Verificando idempotência:', { orderHash, transactionHash });
  
  const { data: existingInvoice, error: invoiceCheckError } = await supabase
    .from('workspace_invoices')
    .select('id, workspace_id, status')
    .eq('payment_id', orderHash)
    .maybeSingle();
  
  if (invoiceCheckError) {
    console.error('❌ Erro ao verificar invoice existente:', invoiceCheckError);
    throw new Error(`Erro na verificação de idempotência: ${invoiceCheckError.message}`);
  }
  
  if (existingInvoice) {
    console.log('⚠️ Pagamento já processado anteriormente:', {
      invoice_id: existingInvoice.id,
      workspace_id: existingInvoice.workspace_id,
      status: existingInvoice.status
    });
    
    return {
      status: 'success',
      event_type: 'purchase.approved',
      event_category: 'payment',
      workspace_id: existingInvoice.workspace_id,
      message: 'Pagamento já processado anteriormente (idempotente)',
      idempotent: true
    };
  }
  
  console.log('✅ Pagamento não processado anteriormente, prosseguindo...');
  // ============= FIM VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  
  // Buscar gateway da Ticto
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id')
    .eq('slug', 'ticto')
    .single();
  
  console.log('🔍 Integration lookup:', { integration, integrationError });
  
  if (!integration) {
    throw new Error('Integração Ticto não encontrada');
  }
  
  const { data: gateway, error: gatewayError } = await supabase
    .from('payment_gateways')
    .select('id')
    .eq('integration_id', integration.id)
    .is('workspace_id', null)
    .single();
  
  console.log('🔍 Gateway lookup:', { gateway, gatewayError, integration_id: integration.id });
  
  if (!gateway) {
    throw new Error('Gateway de pagamento Ticto não encontrado');
  }
  
  // Buscar oferta pelo gateway_offer_id da Ticto (usar código, não ID)
  const tictoOfferCode = payload.item.offer_code || payload.offer?.code;
  
  console.log('📦 Payload offer info:', {
    item_offer_code: payload.item?.offer_code,
    offer_code: payload.offer?.code,
    selected: tictoOfferCode
  });
  
  if (!tictoOfferCode) {
    throw new Error('Código da oferta não encontrado no payload');
  }
  
  console.log('🔍 Buscando oferta pelo código:', tictoOfferCode, 'gateway:', gateway.id);
  
  // Buscar oferta e plano separadamente para evitar problemas com relacionamentos
  const { data: offer, error: offerError } = await supabase
    .from('plan_offers')
    .select('*')
    .eq('gateway_offer_id', tictoOfferCode)
    .eq('payment_gateway_id', gateway.id)
    .eq('is_active', true)
    .single();
  
  console.log('🔍 Resultado da busca da oferta:', { offer, offerError });
  
  if (offerError || !offer) {
    throw new Error(`Oferta ${tictoOfferCode} não encontrada ou não está ativa. Erro: ${offerError?.message}`);
  }
  
  // Buscar o plano associado
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', offer.plan_id)
    .single();
  
  console.log('🔍 Resultado da busca do plano:', { plan, planError });
  
  if (planError || !plan) {
    throw new Error(`Plano ${offer.plan_id} não encontrado. Erro: ${planError?.message}`);
  }
  
  console.log('✅ Oferta e Plano encontrados:', {
    offer_id: offer.id,
    offer_name: offer.name,
    plan_id: plan.id,
    plan_name: plan.name
  });

  // ============= IMPLEMENTAÇÃO DAS 3 REGRAS =============
  // Extrair parâmetros de tracking da URL (Ticto envia em query_params)
  const urlParams = payload.query_params || payload.url_params || {};
  const workspaceIdFromUrl = urlParams.workspace_id;
  const userIdFromUrl = urlParams.user_id;
  const sourceFromUrl = urlParams.source;

  console.log('📊 Tracking params:', {
    workspace_id: workspaceIdFromUrl,
    user_id: userIdFromUrl,
    source: sourceFromUrl,
    customer_email: payload.customer.email
  });

  let targetWorkspaceId: string | null = null;
  let targetUserId: string | null = null;
  let isNewUser = false;
  let isNewWorkspace = false;

  // REGRA 1: workspace_id na URL → processar para aquele workspace
  if (workspaceIdFromUrl) {
    console.log('🎯 REGRA 1: workspace_id na URL detectado');
    
    const workspace = await validateWorkspaceExists(supabase, workspaceIdFromUrl);
    
    if (workspace) {
      targetWorkspaceId = workspace.id;
      targetUserId = workspace.created_by;
      console.log(`✅ REGRA 1: Usando workspace da URL: ${workspace.name}`);
    } else {
      console.warn('⚠️ Workspace da URL não existe, prosseguindo para Regra 2/3');
    }
  }

  // REGRA 2 e 3: Sem workspace_id válido → verificar usuário
  if (!targetWorkspaceId) {
    const profile = await findProfileByEmail(supabase, payload.customer.email);
    
    if (profile) {
      // REGRA 2: Usuário existe → criar novo workspace
      console.log('🎯 REGRA 2: Email existe, criando NOVO workspace');
      
      targetUserId = profile.id;
      targetWorkspaceId = await createWorkspaceForUser(
        supabase,
        profile.id,
        profile.name,
        plan,
        offer,
        payload
      );
      isNewWorkspace = true;
      
      console.log(`✅ REGRA 2: Novo workspace criado: ${targetWorkspaceId}`);
      
    } else {
      // REGRA 3: Usuário não existe → criar conta + workspace
      console.log('🎯 REGRA 3: Email não existe, criando CONTA + WORKSPACE');
      
      const { userId, temporaryPassword } = await createUserFromWebhook(
        supabase,
        payload.customer.email,
        payload.customer.name
      );
      
      targetUserId = userId;
      targetWorkspaceId = await createWorkspaceForUser(
        supabase,
        userId,
        payload.customer.name,
        plan,
        offer,
        payload
      );
      
      isNewUser = true;
      isNewWorkspace = true;
      
      console.log(`✅ REGRA 3: Nova conta e workspace criados: ${targetWorkspaceId}`);
      
      // Enviar email de boas-vindas (não-bloqueante)
      await sendWelcomeEmailWithPasswordSetup(
        payload.customer.email,
        payload.customer.name,
        `Workspace de ${payload.customer.name}`,
        plan.name
      );
    }
  }

  if (!targetWorkspaceId || !targetUserId) {
    throw new Error('Não foi possível determinar workspace e usuário para processar o pagamento');
  }

  console.log('✅ Workspace e usuário determinados:', {
    workspace_id: targetWorkspaceId,
    user_id: targetUserId,
    is_new_user: isNewUser,
    is_new_workspace: isNewWorkspace
  });
  // ============= FIM DAS 3 REGRAS =============

  // Calcular períodos baseado na oferta flexível
  const billingCycle = determineBillingCycle(offer);
  const periodEnd = calculatePeriodEnd(offer);
  
  // Buscar subscription existente para decidir entre UPDATE ou INSERT
  const { data: existingSubscription } = await supabase
    .from('workspace_subscriptions')
    .select('id, status')
    .eq('workspace_id', targetWorkspaceId)
    .single();

  console.log('🔍 Subscription existente:', existingSubscription);

  let newSubscription;
  let subscriptionError;

  if (existingSubscription) {
    // ATUALIZAR subscription existente
    console.log('🔄 Atualizando subscription existente:', existingSubscription.id);
    
    const { data, error } = await supabase
      .from('workspace_subscriptions')
      .update({
        plan_id: plan.id,
        plan_offer_id: offer.id,
        billing_cycle: billingCycle,
        status: 'active',
        current_max_projects: plan.max_projects,
        current_max_copies: plan.max_copies,
        current_copy_ai_enabled: plan.copy_ai_enabled,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd?.toISOString() || null,
        payment_gateway: 'ticto',
        external_subscription_id: payload.subscriptions?.[0]?.id?.toString() || payload.order.hash,
        cancelled_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id)
      .select()
      .single();
    
    newSubscription = data;
    subscriptionError = error;
  } else {
    // CRIAR nova subscription
    console.log('➕ Criando nova subscription');
    
    const subscriptionData = {
      workspace_id: targetWorkspaceId,
      plan_id: plan.id,
      plan_offer_id: offer.id,
      billing_cycle: billingCycle,
      status: 'active' as const,
      current_max_projects: plan.max_projects,
      current_max_copies: plan.max_copies,
      current_copy_ai_enabled: plan.copy_ai_enabled,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd?.toISOString() || null,
      payment_gateway: 'ticto',
      external_subscription_id: payload.subscriptions?.[0]?.id?.toString() || payload.order.hash
    };
    
    const { data, error } = await supabase
      .from('workspace_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();
    
    newSubscription = data;
    subscriptionError = error;
  }

  console.log('📊 Resultado da operação de subscription:', { 
    success: !!newSubscription, 
    subscription_id: newSubscription?.id,
    error: subscriptionError?.message 
  });

  if (subscriptionError || !newSubscription) {
    throw new Error(`Erro ao criar/atualizar subscription: ${subscriptionError?.message || 'Dados não retornados'}. Details: ${JSON.stringify(subscriptionError)}`);
  }

  // Criar invoice com informações da oferta e tracking
  await supabase
    .from('workspace_invoices')
    .insert({
      workspace_id: targetWorkspaceId,
      subscription_id: newSubscription.id,
      invoice_number: await generateInvoiceNumber(supabase),
      notes: sourceFromUrl ? `Origem: ${sourceFromUrl}` : null,
      amount: payload.order.paid_amount / 100,
      currency: 'BRL',
      status: 'paid',
      payment_method: payload.payment_method,
      payment_id: payload.order.hash,
      external_payment_id: payload.order.hash,
      paid_at: new Date(payload.status_date).toISOString(),
      billing_period_start: new Date().toISOString(),
      billing_period_end: periodEnd?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      due_date: new Date().toISOString(),
      line_items: [{
        description: `${plan.name} - ${offer.name}`,
        amount: payload.order.paid_amount / 100,
        quantity: 1
      }],
      metadata: {
        ticto_order_id: payload.order.id,
        ticto_transaction_hash: payload.order.transaction_hash,
        installments: payload.order.installments,
        offer_id: offer.id,
        offer_name: offer.name
      }
    });

  // Adicionar créditos
  const { data: credits } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', targetWorkspaceId)
    .single();

  const newBalance = (credits?.balance || 0) + plan.credits_per_month;

  await supabase
    .from('workspace_credits')
    .update({
      balance: newBalance,
      total_added: (credits?.balance || 0) + plan.credits_per_month
    })
    .eq('workspace_id', targetWorkspaceId);

  // Registrar transação
  await supabase
    .from('credit_transactions')
    .insert({
      workspace_id: targetWorkspaceId,
      user_id: targetUserId,
      transaction_type: 'credit',
      amount: plan.credits_per_month,
      balance_before: credits?.balance || 0,
      balance_after: newBalance,
      description: `Créditos do plano ${plan.name} - Pagamento Ticto aprovado`
    });

  return {
    status: 'success',
    event_type: 'purchase.approved',
    event_category: 'payment',
    workspace_id: targetWorkspaceId,
    user_id: targetUserId,
    is_new_user: isNewUser,
    is_new_workspace: isNewWorkspace,
    plan_name: plan.name,
    credits_added: plan.credits_per_month,
    message: 'Venda aprovada e assinatura ativada'
  };
}

// 2. Chargeback
async function handleChargeback(supabase: any, payload: TictoWebhookPayload): Promise<EventResult> {
  console.log('⚠️ Processando chargeback...');
  
  // Atualizar invoice para chargeback
  const { data: invoice } = await supabase
    .from('workspace_invoices')
    .update({ status: 'chargeback' })
    .eq('external_payment_id', payload.order.hash)
    .select()
    .single();

  if (!invoice) {
    throw new Error('Invoice não encontrada');
  }

  // Buscar owner do workspace para registrar transação
  const ownerId = await getWorkspaceOwnerId(supabase, invoice.workspace_id);
  if (!ownerId) {
    throw new Error('Owner do workspace não encontrado');
  }

  // Remover créditos proporcionalmente
  const { data: credits } = await supabase
    .from('workspace_credits')
    .select('balance, total_used')
    .eq('workspace_id', invoice.workspace_id)
    .single();

  const debitAmount = invoice.amount * 0.1; // Exemplo: debitar 10% como penalidade
  const currentBalance = credits?.balance || 0;
  const newBalance = Math.max(0, currentBalance - debitAmount);

  // CORRIGIDO: Incrementar total_used corretamente
  await supabase
    .from('workspace_credits')
    .update({
      balance: newBalance,
      total_used: (credits?.total_used || 0) + debitAmount
    })
    .eq('workspace_id', invoice.workspace_id);

  // Registrar transação de débito
  await supabase
    .from('credit_transactions')
    .insert({
      workspace_id: invoice.workspace_id,
      user_id: ownerId,
      transaction_type: 'debit',
      amount: debitAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Chargeback - Penalidade de 10% sobre o valor da invoice ${invoice.invoice_number}`
    });

  // Suspender assinatura
  await supabase
    .from('workspace_subscriptions')
    .update({ status: 'past_due' })
    .eq('id', invoice.subscription_id);

  return {
    status: 'success',
    event_type: 'payment.chargeback',
    event_category: 'refund',
    workspace_id: invoice.workspace_id,
    credits_debited: debitAmount,
    message: 'Chargeback processado e créditos ajustados'
  };
}

// 3. Reembolso
async function handleRefund(supabase: any, payload: TictoWebhookPayload): Promise<EventResult> {
  console.log('💸 Processando reembolso...');
  
  const { data: invoice } = await supabase
    .from('workspace_invoices')
    .update({ status: 'refunded' })
    .eq('external_payment_id', payload.order.hash)
    .select()
    .single();

  if (!invoice) {
    throw new Error('Invoice não encontrada');
  }

  // Buscar owner do workspace para registrar transação
  const ownerId = await getWorkspaceOwnerId(supabase, invoice.workspace_id);
  if (!ownerId) {
    throw new Error('Owner do workspace não encontrado');
  }

  // Remover créditos proporcionalmente
  const { data: credits } = await supabase
    .from('workspace_credits')
    .select('balance, total_used')
    .eq('workspace_id', invoice.workspace_id)
    .single();

  const refundAmount = invoice.amount * 0.5; // Remover 50% dos créditos
  const currentBalance = credits?.balance || 0;
  const newBalance = Math.max(0, currentBalance - refundAmount);

  // CORRIGIDO: Atualizar balance e total_used
  await supabase
    .from('workspace_credits')
    .update({ 
      balance: newBalance,
      total_used: (credits?.total_used || 0) + refundAmount
    })
    .eq('workspace_id', invoice.workspace_id);

  // Registrar transação de débito
  await supabase
    .from('credit_transactions')
    .insert({
      workspace_id: invoice.workspace_id,
      user_id: ownerId,
      transaction_type: 'debit',
      amount: refundAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Reembolso - Remoção de 50% dos créditos referente à invoice ${invoice.invoice_number}`
    });

  // Cancelar assinatura associada
  await supabase
    .from('workspace_subscriptions')
    .update({ 
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', invoice.subscription_id);

  return {
    status: 'success',
    event_type: 'payment.refunded',
    event_category: 'refund',
    workspace_id: invoice.workspace_id,
    credits_removed: refundAmount,
    message: 'Reembolso processado e assinatura cancelada'
  };
}

// 4. Assinatura Cancelada
async function handleSubscriptionCancelled(supabase: any, payload: TictoWebhookPayload): Promise<EventResult> {
  console.log('❌ Processando cancelamento de assinatura...');
  
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString() || payload.order.hash;
  
  const { data: subscription } = await supabase
    .from('workspace_subscriptions')
    .update({ 
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('external_subscription_id', subscriptionId)
    .select()
    .single();

  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }

  return {
    status: 'success',
    event_type: 'subscription.cancelled',
    event_category: 'subscription',
    workspace_id: subscription.workspace_id,
    message: 'Assinatura cancelada'
  };
}

// 5. Cartão Atualizado
async function handleCardUpdated(supabase: any, payload: TictoWebhookPayload): Promise<EventResult> {
  console.log('💳 Processando atualização de cartão...');
  
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString();
  
  if (!subscriptionId) {
    throw new Error('ID da assinatura não encontrado');
  }

  // Apenas registrar o evento - não mexer em créditos
  return {
    status: 'success',
    event_type: 'subscription.card_updated',
    event_category: 'subscription',
    message: 'Cartão atualizado'
  };
}

// 6. Trial Iniciado
async function handleTrialStarted(supabase: any, payload: TictoWebhookPayload, config: any): Promise<EventResult> {
  console.log('🆓 Processando início de trial...');
  
  // ============= VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  // Verificar se este trial já foi processado antes
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString();
  
  console.log('🔍 Verificando idempotência (trial):', { subscriptionId });
  
  if (subscriptionId) {
    const { data: existingSubscription } = await supabase
      .from('workspace_subscriptions')
      .select('id, workspace_id, status')
      .eq('external_subscription_id', subscriptionId)
      .eq('status', 'trialing')
      .single();
    
    if (existingSubscription) {
      console.log('⚠️ Trial já processado anteriormente:', {
        subscription_id: existingSubscription.id,
        workspace_id: existingSubscription.workspace_id,
        status: existingSubscription.status
      });
      
      return {
        status: 'success',
        event_type: 'subscription.trial_started',
        event_category: 'subscription',
        workspace_id: existingSubscription.workspace_id,
        message: 'Trial já processado anteriormente (idempotente)',
        idempotent: true
      };
    }
  }
  
  console.log('✅ Trial não processado anteriormente, prosseguindo...');
  // ============= FIM VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  
  // Buscar gateway da Ticto
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id')
    .eq('slug', 'ticto')
    .single();
  
  console.log('🔍 Integration lookup (trial):', { integration, integrationError });
  
  if (!integration) {
    throw new Error('Integração Ticto não encontrada');
  }
  
  const { data: gateway, error: gatewayError } = await supabase
    .from('payment_gateways')
    .select('id')
    .eq('integration_id', integration.id)
    .is('workspace_id', null)
    .single();
  
  console.log('🔍 Gateway lookup (trial):', { gateway, gatewayError, integration_id: integration.id });
  
  if (!gateway) {
    throw new Error('Gateway de pagamento Ticto não encontrado');
  }
  
  // Buscar oferta pelo gateway_offer_id (usar código, não ID)
  const tictoOfferCode = payload.item.offer_code || payload.offer?.code;
  
  console.log('📦 Payload offer info (trial):', {
    item_offer_code: payload.item?.offer_code,
    offer_code: payload.offer?.code,
    selected: tictoOfferCode
  });
  
  if (!tictoOfferCode) {
    throw new Error('Código da oferta não encontrado no payload');
  }
  
  console.log('🔍 Buscando oferta pelo código (trial):', tictoOfferCode, 'gateway:', gateway.id);
  
  // Buscar oferta e plano separadamente para evitar problemas com relacionamentos
  const { data: offer, error: offerError } = await supabase
    .from('plan_offers')
    .select('*')
    .eq('gateway_offer_id', tictoOfferCode)
    .eq('payment_gateway_id', gateway.id)
    .eq('is_active', true)
    .single();
  
  console.log('🔍 Resultado da busca da oferta (trial):', { offer, offerError });
  
  if (offerError || !offer) {
    throw new Error(`Oferta ${tictoOfferCode} não encontrada ou não está ativa. Erro: ${offerError?.message}`);
  }
  
  // Buscar o plano associado
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', offer.plan_id)
    .single();
  
  console.log('🔍 Resultado da busca do plano (trial):', { plan, planError });
  
  if (planError || !plan) {
    throw new Error(`Plano ${offer.plan_id} não encontrado. Erro: ${planError?.message}`);
  }
  
  console.log('✅ Oferta e Plano encontrados (trial):', {
    offer_id: offer.id,
    offer_name: offer.name,
    plan_id: plan.id,
    plan_name: plan.name
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', payload.customer.email)
    .single();

  if (!profile) {
    throw new Error('Usuário não encontrado');
  }

  const { data: member } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', profile.id)
    .eq('role', 'owner')
    .single();

  if (!member) {
    throw new Error('Workspace não encontrado');
  }

  // Validar se workspace existe no banco antes de continuar
  console.log('🔍 Validando workspace (trial):', member.workspace_id);
  const { data: workspaceExists, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', member.workspace_id)
    .single();

  if (workspaceError || !workspaceExists) {
    throw new Error(`Workspace ${member.workspace_id} não existe no banco de dados. Erro: ${workspaceError?.message}`);
  }
  
  console.log('✅ Workspace validado (trial):', workspaceExists.name);

  const trialDays = payload.item.trial_days || 7;
  const trialEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
  const billingCycle = determineBillingCycle(offer);

  // Buscar subscription existente para decidir entre UPDATE ou INSERT
  const { data: existingSubscription } = await supabase
    .from('workspace_subscriptions')
    .select('id, status')
    .eq('workspace_id', member.workspace_id)
    .single();

  console.log('🔍 Subscription existente (trial):', existingSubscription);

  let newSubscription;
  let subscriptionError;

  if (existingSubscription) {
    // ATUALIZAR subscription existente
    console.log('🔄 Atualizando subscription existente para trial:', existingSubscription.id);
    
    const { data, error } = await supabase
      .from('workspace_subscriptions')
      .update({
        plan_id: plan.id,
        plan_offer_id: offer.id,
        billing_cycle: billingCycle,
        status: 'trialing',
        current_max_projects: plan.max_projects,
        current_max_copies: plan.max_copies,
        current_copy_ai_enabled: plan.copy_ai_enabled,
        started_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndDate.toISOString(),
        payment_gateway: 'ticto',
        external_subscription_id: payload.subscriptions?.[0]?.id?.toString(),
        cancelled_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id)
      .select()
      .single();
    
    newSubscription = data;
    subscriptionError = error;
  } else {
    // CRIAR nova subscription
    console.log('➕ Criando nova subscription em trial');
    
    const subscriptionData = {
      workspace_id: member.workspace_id,
      plan_id: plan.id,
      plan_offer_id: offer.id,
      billing_cycle: billingCycle,
      status: 'trialing' as const,
      current_max_projects: plan.max_projects,
      current_max_copies: plan.max_copies,
      current_copy_ai_enabled: plan.copy_ai_enabled,
      started_at: new Date().toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: trialEndDate.toISOString(),
      payment_gateway: 'ticto',
      external_subscription_id: payload.subscriptions?.[0]?.id?.toString()
    };
    
    const { data, error } = await supabase
      .from('workspace_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();
    
    newSubscription = data;
    subscriptionError = error;
  }

  console.log('📊 Resultado da operação de subscription (trial):', { 
    success: !!newSubscription, 
    subscription_id: newSubscription?.id,
    error: subscriptionError?.message 
  });

  if (subscriptionError || !newSubscription) {
    throw new Error(`Erro ao criar/atualizar subscription em trial: ${subscriptionError?.message || 'Dados não retornados'}. Details: ${JSON.stringify(subscriptionError)}`);
  }

  return {
    status: 'success',
    event_type: 'subscription.trial_started',
    event_category: 'subscription',
    workspace_id: member.workspace_id,
    trial_days: trialDays,
    message: 'Trial iniciado com todos os limites do plano'
  };
}

// 7. Trial Encerrado
async function handleTrialEnded(supabase: any, payload: TictoWebhookPayload, config: any): Promise<EventResult> {
  console.log('🔚 Processando fim de trial...');
  
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString();
  const subscriptionData = payload.subscriptions?.[0];
  
  // ============= VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  console.log('🔍 Verificando idempotência (trial ended):', { subscriptionId });
  
  // Verificar se já processamos esse fim de trial (se subscription já está active)
  if (subscriptionId) {
    const { data: existingActiveSubscription } = await supabase
      .from('workspace_subscriptions')
      .select('id, workspace_id, status, current_period_start')
      .eq('external_subscription_id', subscriptionId)
      .eq('status', 'active')
      .single();
    
    if (existingActiveSubscription && existingActiveSubscription.current_period_start) {
      // Já foi convertido antes
      const periodStart = new Date(existingActiveSubscription.current_period_start);
      const now = new Date();
      const hoursDiff = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
      
      // Se foi ativado há menos de 24h, considera como já processado
      if (hoursDiff < 24) {
        console.log('⚠️ Trial ended já processado anteriormente:', {
          subscription_id: existingActiveSubscription.id,
          workspace_id: existingActiveSubscription.workspace_id,
          activated_hours_ago: hoursDiff.toFixed(2)
        });
        
        return {
          status: 'success',
          event_type: 'subscription.trial_ended',
          event_category: 'subscription',
          workspace_id: existingActiveSubscription.workspace_id,
          message: 'Trial ended já processado anteriormente (idempotente)',
          idempotent: true
        };
      }
    }
  }
  
  console.log('✅ Trial ended não processado recentemente, prosseguindo...');
  // ============= FIM VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  
  const { data: subscription } = await supabase
    .from('workspace_subscriptions')
    .select('*, subscription_plans(*), plan_offers(*)')
    .eq('external_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }

  const plan = subscription.subscription_plans;
  const offer = subscription.plan_offers;

  // REFATORADO: Verificar se houve conversão para pagamento ou cancelamento
  // Se next_charge existe, trial converteu para assinatura paga
  const hasConverted = subscriptionData?.next_charge && !subscriptionData?.canceled_at;
  
  if (hasConverted) {
    console.log('✅ Trial converteu para assinatura paga');
    
    // Buscar owner para registrar transação
    const ownerId = await getWorkspaceOwnerId(supabase, subscription.workspace_id);
    if (!ownerId) {
      throw new Error('Owner do workspace não encontrado');
    }
    
    // Ativar assinatura e definir períodos baseado na oferta
    const periodStart = new Date();
    const periodEnd = offer ? calculatePeriodEnd(offer) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await supabase
      .from('workspace_subscriptions')
      .update({ 
        status: 'active',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd?.toISOString() || null
      })
      .eq('id', subscription.id);

    // Adicionar créditos do plano
    const { data: credits } = await supabase
      .from('workspace_credits')
      .select('balance')
      .eq('workspace_id', subscription.workspace_id)
      .single();

    const currentBalance = credits?.balance || 0;
    const newBalance = currentBalance + plan.credits_per_month;

    await supabase
      .from('workspace_credits')
      .update({
        balance: newBalance,
        total_added: (credits?.balance || 0) + plan.credits_per_month
      })
      .eq('workspace_id', subscription.workspace_id);

    // Registrar transação
    await supabase
      .from('credit_transactions')
      .insert({
        workspace_id: subscription.workspace_id,
        user_id: ownerId,
        transaction_type: 'credit',
        amount: plan.credits_per_month,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Créditos do plano ${plan.name} - Trial convertido para assinatura paga`
      });

    // Criar invoice da primeira cobrança
    await supabase
      .from('workspace_invoices')
      .insert({
        workspace_id: subscription.workspace_id,
        subscription_id: subscription.id,
        invoice_number: await generateInvoiceNumber(supabase),
        amount: payload.order.paid_amount / 100,
        currency: 'BRL',
        status: 'paid',
        payment_method: payload.payment_method,
        payment_id: payload.order.hash,
        external_payment_id: payload.order.hash,
        paid_at: new Date(payload.status_date).toISOString(),
        billing_period_start: periodStart.toISOString(),
        billing_period_end: periodEnd?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        due_date: periodStart.toISOString(),
      line_items: [{
        description: `${plan.name} - Mensal`,
        amount: payload.order.paid_amount / 100,
        quantity: 1
      }],
      metadata: { 
        trial_conversion: true,
        ticto_order_id: payload.order.id 
      }
    });

    return {
      status: 'success',
      event_type: 'subscription.trial_ended',
      event_category: 'subscription',
      workspace_id: subscription.workspace_id,
      converted: true,
      credits_added: plan.credits_per_month,
      message: 'Trial encerrado e convertido para assinatura paga'
    };
  } else {
    console.log('❌ Trial não converteu - cancelando assinatura');
    
    // Trial não converteu, cancelar assinatura
    await supabase
      .from('workspace_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    return {
      status: 'success',
      event_type: 'subscription.trial_ended',
      event_category: 'subscription',
      workspace_id: subscription.workspace_id,
      converted: false,
      message: 'Trial encerrado sem conversão - assinatura cancelada'
    };
  }
}

// 8. Assinatura Retomada
async function handleSubscriptionResumed(supabase: any, payload: TictoWebhookPayload, config: any): Promise<EventResult> {
  console.log('▶️ Processando retomada de assinatura...');
  
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString();
  
  // ============= VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  console.log('🔍 Verificando idempotência (subscription resumed):', { subscriptionId });
  
  // Verificar se já processamos recentemente pela última transação de crédito
  if (subscriptionId) {
    const { data: recentTransaction } = await supabase
      .from('credit_transactions')
      .select('id, workspace_id, created_at, description')
      .ilike('description', '%Assinatura retomada%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (recentTransaction) {
      const transactionDate = new Date(recentTransaction.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
      
      // Se já adicionou créditos de retomada há menos de 1h, considera idempotente
      if (hoursDiff < 1) {
        console.log('⚠️ Subscription resumed já processado anteriormente:', {
          transaction_id: recentTransaction.id,
          workspace_id: recentTransaction.workspace_id,
          processed_hours_ago: hoursDiff.toFixed(2)
        });
        
        return {
          status: 'success',
          event_type: 'subscription.resumed',
          event_category: 'subscription',
          workspace_id: recentTransaction.workspace_id,
          message: 'Subscription resumed já processado anteriormente (idempotente)',
          idempotent: true
        };
      }
    }
  }
  
  console.log('✅ Subscription resumed não processado recentemente, prosseguindo...');
  // ============= FIM VERIFICAÇÃO DE IDEMPOTÊNCIA =============
  
  const { data: subscription } = await supabase
    .from('workspace_subscriptions')
    .select('*, subscription_plans(*), plan_offers(*)')
    .eq('external_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }
  
  // Calcular período baseado na oferta
  const offer = subscription.plan_offers;
  const periodEnd = offer ? calculatePeriodEnd(offer) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  await supabase
    .from('workspace_subscriptions')
    .update({ 
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd?.toISOString() || null
    })
    .eq('id', subscription.id);

  // CORRIGIDO: Buscar owner para registrar transação
  const ownerId = await getWorkspaceOwnerId(supabase, subscription.workspace_id);
  if (!ownerId) {
    throw new Error('Owner do workspace não encontrado');
  }

  // Adicionar créditos do período
  const plan = subscription.subscription_plans;
  const { data: credits } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', subscription.workspace_id)
    .single();

  const currentBalance = credits?.balance || 0;
  const newBalance = currentBalance + plan.credits_per_month;

  await supabase
    .from('workspace_credits')
    .update({ 
      balance: newBalance,
      total_added: (credits?.balance || 0) + plan.credits_per_month
    })
    .eq('workspace_id', subscription.workspace_id);

  // Registrar transação de crédito
  await supabase
    .from('credit_transactions')
    .insert({
      workspace_id: subscription.workspace_id,
      user_id: ownerId,
      transaction_type: 'credit',
      amount: plan.credits_per_month,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Créditos do plano ${plan.name} - Assinatura retomada`
    });

  return {
    status: 'success',
    event_type: 'subscription.resumed',
    event_category: 'subscription',
    workspace_id: subscription.workspace_id,
    credits_added: plan.credits_per_month,
    message: 'Assinatura retomada'
  };
}

// 9. Assinatura Atrasada
async function handleSubscriptionPastDue(supabase: any, payload: TictoWebhookPayload): Promise<EventResult> {
  console.log('⏰ Processando atraso de assinatura...');
  
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString();
  
  const { data: subscription } = await supabase
    .from('workspace_subscriptions')
    .update({ status: 'past_due' })
    .eq('external_subscription_id', subscriptionId)
    .select()
    .single();

  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }

  // Criar invoice pendente
  await supabase
    .from('workspace_invoices')
    .insert({
      workspace_id: subscription.workspace_id,
      subscription_id: subscription.id,
      invoice_number: await generateInvoiceNumber(supabase),
      amount: payload.order.paid_amount / 100,
      currency: 'BRL',
      status: 'pending',
      payment_method: payload.payment_method,
      external_payment_id: payload.order.hash,
      due_date: new Date().toISOString(),
      billing_period_start: new Date().toISOString(),
      billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: { reason: 'past_due' }
    });

  return {
    status: 'success',
    event_type: 'subscription.past_due',
    event_category: 'subscription',
    workspace_id: subscription.workspace_id,
    message: 'Assinatura marcada como atrasada'
  };
}

// 10. Assinatura Extendida
async function handleSubscriptionExtended(supabase: any, payload: TictoWebhookPayload, config: any): Promise<EventResult> {
  console.log('⏳ Processando extensão de assinatura...');
  
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString();
  const nextCharge = payload.subscriptions?.[0]?.next_charge;
  
  const { data: subscription } = await supabase
    .from('workspace_subscriptions')
    .select('*, subscription_plans(*), plan_offers(*)')
    .eq('external_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }
  
  // Calcular novo período baseado na oferta
  const offer = subscription.plan_offers;
  const periodEnd = nextCharge 
    ? new Date(nextCharge) 
    : (offer ? calculatePeriodEnd(offer) : null);
  
  await supabase
    .from('workspace_subscriptions')
    .update({ 
      current_period_end: periodEnd?.toISOString() || null
    })
    .eq('id', subscription.id);

  // CORRIGIDO: Buscar owner para registrar transação
  const ownerId = await getWorkspaceOwnerId(supabase, subscription.workspace_id);
  if (!ownerId) {
    throw new Error('Owner do workspace não encontrado');
  }

  // Adicionar créditos proporcionais
  const plan = subscription.subscription_plans;
  const extensionCredits = plan.credits_per_month * 0.5; // 50% dos créditos do mês
  
  const { data: credits } = await supabase
    .from('workspace_credits')
    .select('balance')
    .eq('workspace_id', subscription.workspace_id)
    .single();

  const currentBalance = credits?.balance || 0;
  const newBalance = currentBalance + extensionCredits;

  await supabase
    .from('workspace_credits')
    .update({ 
      balance: newBalance,
      total_added: (credits?.balance || 0) + extensionCredits
    })
    .eq('workspace_id', subscription.workspace_id);

  // Registrar transação de crédito
  await supabase
    .from('credit_transactions')
    .insert({
      workspace_id: subscription.workspace_id,
      user_id: ownerId,
      transaction_type: 'credit',
      amount: extensionCredits,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Créditos proporcionais (50%) - Assinatura extendida`
    });

  return {
    status: 'success',
    event_type: 'subscription.extended',
    event_category: 'subscription',
    workspace_id: subscription.workspace_id,
    credits_added: extensionCredits,
    message: 'Assinatura extendida'
  };
}

// 11. Assinatura Encerrada
async function handleSubscriptionEnded(supabase: any, payload: TictoWebhookPayload): Promise<EventResult> {
  console.log('🏁 Processando encerramento de assinatura...');
  
  const subscriptionId = payload.subscriptions?.[0]?.id?.toString();
  
  const { data: subscription } = await supabase
    .from('workspace_subscriptions')
    .update({ 
      status: 'expired',
      cancelled_at: new Date().toISOString()
    })
    .eq('external_subscription_id', subscriptionId)
    .select()
    .single();

  if (!subscription) {
    throw new Error('Assinatura não encontrada');
  }

  return {
    status: 'success',
    event_type: 'subscription.ended',
    event_category: 'subscription',
    workspace_id: subscription.workspace_id,
    message: 'Assinatura encerrada - todas as cobranças finalizadas'
  };
}

// Função auxiliar para gerar número de invoice
async function generateInvoiceNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const { count } = await supabase
    .from('workspace_invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `INV-${year}${month}%`);
  
  const sequence = String((count || 0) + 1).padStart(6, '0');
  return `INV-${year}${month}-${sequence}`;
}
