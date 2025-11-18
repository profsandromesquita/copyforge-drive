import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  copyId: string;
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header in copy-chat');
      return new Response(
        JSON.stringify({ error: 'missing_authorization', message: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('❌ Unauthorized in copy-chat:', userError || 'No user');
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('✓ User autenticado em copy-chat:', userId);

    const body: ChatRequest = await req.json();
    const { copyId, message } = body;

    if (!copyId || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'invalid_request', message: 'copyId e message são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados da copy
    const { data: copy, error: copyError } = await supabase
      .from('copies')
      .select('id, workspace_id, title, copy_type, sessions')
      .eq('id', copyId)
      .single();

    if (copyError || !copy) {
      console.error('❌ Copy não encontrada:', copyError);
      return new Response(
        JSON.stringify({ error: 'copy_not_found', message: 'Copy não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const workspaceId = copy.workspace_id;

    // Buscar histórico de gerações (últimas 15 para balancear contexto vs tokens)
    const { data: generationHistory, error: historyError } = await supabase
      .from('ai_generation_history')
      .select('id, generation_type, generation_category, created_at, prompt, model_used, sessions, original_content')
      .eq('copy_id', copyId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (historyError) {
      console.error('⚠️ Erro ao buscar histórico de gerações:', historyError);
    }

    console.log(`📚 Histórico carregado: ${generationHistory?.length || 0} gerações`);

    // Verificar créditos do workspace
    const { data: creditCheck, error: creditError } = await supabaseAdmin.rpc('check_workspace_credits', {
      p_workspace_id: workspaceId,
      estimated_tokens: 5000,
      p_model_name: 'google/gemini-2.5-flash'
    });

    if (creditError) {
      console.error('❌ Erro ao verificar créditos:', creditError);
      return new Response(
        JSON.stringify({ error: 'credit_check_failed', message: 'Erro ao verificar créditos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!creditCheck?.has_sufficient_credits) {
      console.log('❌ Créditos insuficientes para workspace:', workspaceId);
      return new Response(
        JSON.stringify({ 
          error: 'insufficient_credits',
          message: 'Créditos insuficientes',
          current_balance: creditCheck?.current_balance,
          estimated_debit: creditCheck?.estimated_debit
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar histórico recente de mensagens (últimas 20)
    const { data: chatHistory, error: historyError } = await supabase
      .from('copy_chat_messages')
      .select('role, content, created_at')
      .eq('copy_id', copyId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyError) {
      console.error('⚠️ Erro ao buscar histórico:', historyError);
    }

    // Construir contexto da copy
    const copyContext = buildCopyContext(copy);

    // Construir contexto do histórico com compressão dinâmica
    const historyContext = buildGenerationHistoryContext(generationHistory || []);

    // Construir system prompt especializado COM histórico
    const systemPrompt = buildSystemPrompt(copyContext, historyContext);

    // Construir mensagens para a IA
    const messages: ChatMessage[] = [
      { role: 'user' as const, content: systemPrompt },
      ...(chatHistory || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    console.log(`📤 Enviando para Lovable AI: ${messages.length} mensagens (com histórico de ${generationHistory?.length || 0} gerações)`);

    // Chamar Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Erro da Lovable AI:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'rate_limit_exceeded', message: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'lovable_ai_credits_required', message: 'Créditos Lovable AI necessários. Adicione créditos em Settings -> Workspace -> Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0]?.message?.content || '';
    const usage = aiData.usage;

    console.log('✓ Resposta recebida da IA');
    console.log('📊 Uso de tokens:', usage);

    // Salvar mensagem do usuário
    const { error: userMsgError } = await supabase
      .from('copy_chat_messages')
      .insert({
        copy_id: copyId,
        workspace_id: workspaceId,
        user_id: userId,
        role: 'user',
        content: message,
      });

    if (userMsgError) {
      console.error('⚠️ Erro ao salvar mensagem do usuário:', userMsgError);
    }

    // Salvar resposta da IA
    const { error: assistantMsgError } = await supabase
      .from('copy_chat_messages')
      .insert({
        copy_id: copyId,
        workspace_id: workspaceId,
        user_id: userId,
        role: 'assistant',
        content: assistantMessage,
      });

    if (assistantMsgError) {
      console.error('⚠️ Erro ao salvar resposta da IA:', assistantMsgError);
    }

    // Debitar créditos
    if (usage) {
      const { error: debitError } = await supabaseAdmin.rpc('debit_workspace_credits', {
        p_workspace_id: workspaceId,
        p_model_name: 'google/gemini-2.5-flash',
        tokens_used: usage.total_tokens || 0,
        p_input_tokens: usage.prompt_tokens || 0,
        p_output_tokens: usage.completion_tokens || 0,
        generation_id: null,
        p_user_id: userId
      });

      if (debitError) {
        console.error('⚠️ Erro ao debitar créditos:', debitError);
      } else {
        console.log('✓ Créditos debitados com sucesso');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
        tokens: usage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro em copy-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildCopyContext(copy: any): string {
  const copyTypeName = getCopyTypeName(copy.copy_type);
  const sessions = copy.sessions || [];
  
  let context = `Copy: "${copy.title}"\n`;
  context += `Tipo: ${copyTypeName}\n\n`;
  context += `Estrutura atual:\n`;
  
  sessions.forEach((session: any, idx: number) => {
    context += `\nSessão ${idx + 1}: ${session.title}\n`;
    (session.blocks || []).forEach((block: any, blockIdx: number) => {
      const blockType = getBlockTypeName(block.type);
      const content = Array.isArray(block.content) 
        ? block.content.join(', ') 
        : String(block.content || '').substring(0, 100);
      context += `  ${blockIdx + 1}. [${blockType}] ${content}${content.length > 100 ? '...' : ''}\n`;
    });
  });
  
  return context;
}

function buildSystemPrompt(copyContext: string): string {
  return `Você é um especialista em copywriting e marketing digital que está ajudando a aprimorar uma copy específica.

CONTEXTO DA COPY:
${copyContext}

SEU PAPEL:
- Você é um assistente especializado focado EXCLUSIVAMENTE nesta copy
- Analise a estrutura e conteúdo atual para dar sugestões contextualizadas
- Sugira melhorias de copywriting, estrutura, persuasão e conversão
- Identifique pontos fracos e oportunidades de otimização
- Seja direto, prático e orientado a resultados

DIRETRIZES:
1. Mantenha o foco na copy atual - não fale de outros projetos
2. Base suas sugestões na estrutura existente
3. Use princípios de copywriting comprovados (AIDA, PAS, storytelling, etc.)
4. Seja específico - cite seções e blocos exatos ao dar feedback
5. Priorize conversão e clareza na comunicação
6. Considere o tipo de copy ao dar sugestões

IMPORTANTE:
- Você tem memória das conversas anteriores sobre esta copy
- Responda de forma conversacional e amigável
- Se o usuário pedir para implementar mudanças, explique que ele pode usar os botões de IA do editor para fazer isso
- Quando sugerir mudanças, seja específico sobre onde e por quê

Agora responda à pergunta do usuário sobre esta copy:`;
}

function getCopyTypeName(type: string): string {
  const types: Record<string, string> = {
    'landing_page': 'Landing Page',
    'anuncio': 'Anúncio',
    'vsl': 'VSL',
    'email': 'Email',
    'webinar': 'Webinar',
    'conteudo': 'Conteúdo',
    'mensagem': 'Mensagem',
    'outro': 'Outro'
  };
  return types[type] || type;
}

function getBlockTypeName(type: string): string {
  const types: Record<string, string> = {
    'text': 'Texto',
    'headline': 'Título',
    'subheadline': 'Subtítulo',
    'list': 'Lista',
    'button': 'Botão',
    'form': 'Formulário',
    'image': 'Imagem',
    'video': 'Vídeo',
    'audio': 'Áudio',
    'faq': 'FAQ',
    'testimonial': 'Depoimento'
  };
  return types[type] || type;
}