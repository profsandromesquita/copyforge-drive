import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-activation-secret',
};

// =============================================
// FASE 4.2: VALIDAÇÃO INTERNA DE SEGURANÇA
// Esta função não usa JWT mas requer secret interno
// =============================================

const ACTIVATION_SECRET = Deno.env.get('WORKSPACE_ACTIVATION_SECRET');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // =============================================
    // VALIDAÇÃO DE SECRET INTERNO
    // Previne chamadas não autorizadas
    // =============================================
    const providedSecret = req.headers.get('x-activation-secret');
    
    // Se o secret está configurado, validar
    if (ACTIVATION_SECRET && ACTIVATION_SECRET.length > 0) {
      if (!providedSecret || providedSecret !== ACTIVATION_SECRET) {
        console.error('Invalid or missing activation secret');
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Invalid activation secret' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      console.log('Activation secret validated successfully');
    } else {
      // Secret não configurado - log warning mas permite (para backward compatibility)
      console.warn('WARNING: WORKSPACE_ACTIVATION_SECRET not configured. Function is unprotected!');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { workspace_id, payment_id, plan_offer_id } = await req.json();

    console.log('Activating workspace after payment:', { workspace_id, payment_id, plan_offer_id });

    if (!workspace_id) {
      throw new Error('workspace_id is required');
    }

    // Verificar se workspace existe e está inativo
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, is_active')
      .eq('id', workspace_id)
      .single();

    if (workspaceError || !workspace) {
      throw new Error(`Workspace not found: ${workspaceError?.message}`);
    }

    if (workspace.is_active) {
      console.log('Workspace already active:', workspace_id);
      return new Response(
        JSON.stringify({ success: true, message: 'Workspace already active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Ativar workspace
    const { error: activateError } = await supabase
      .from('workspaces')
      .update({ is_active: true })
      .eq('id', workspace_id);

    if (activateError) {
      throw new Error(`Failed to activate workspace: ${activateError.message}`);
    }

    // Se houver plan_offer_id, atualizar a subscription para ativa
    if (plan_offer_id) {
      const { error: subscriptionError } = await supabase
        .from('workspace_subscriptions')
        .update({ 
          status: 'active',
          plan_offer_id: plan_offer_id,
          external_subscription_id: payment_id
        })
        .eq('workspace_id', workspace_id)
        .eq('status', 'pending_payment');

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        // Não falhar a ativação do workspace por causa disso
      }
    }

    console.log('Workspace activated successfully:', workspace_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Workspace activated successfully',
        workspace_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error activating workspace:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
