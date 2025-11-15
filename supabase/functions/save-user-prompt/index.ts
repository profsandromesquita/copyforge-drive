import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PROMPT_LENGTH = 5000;
const RATE_LIMIT_EDITS = 10;
const RATE_LIMIT_HOURS = 1;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { promptKey, workspaceId, customPrompt } = await req.json();

    if (!promptKey || !workspaceId || !customPrompt) {
      return new Response(JSON.stringify({ error: 'promptKey, workspaceId, and customPrompt are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar tamanho
    if (customPrompt.length > MAX_PROMPT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Prompt muito longo. Máximo: ${MAX_PROMPT_LENGTH} caracteres.` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitizar entrada básica
    const sanitized = customPrompt
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verificar autenticação
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar membership no workspace
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .single();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Usuário não é membro deste workspace' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting: verificar últimas edições
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - RATE_LIMIT_HOURS);

    const { count, error: countError } = await supabase
      .from('user_prompt_customizations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('updated_at', hoursAgo.toISOString());

    if (!countError && count && count >= RATE_LIMIT_EDITS) {
      return new Response(
        JSON.stringify({ 
          error: `Limite de ${RATE_LIMIT_EDITS} edições por hora atingido. Aguarde antes de tentar novamente.` 
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // UPSERT: inserir ou atualizar personalização
    const { data, error } = await supabase
      .from('user_prompt_customizations')
      .upsert(
        {
          user_id: user.id,
          workspace_id: workspaceId,
          prompt_key: promptKey,
          custom_prompt: sanitized,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,workspace_id,prompt_key',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving customization:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar personalização' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Prompt personalizado salvo com sucesso!',
        data 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in save-user-prompt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
