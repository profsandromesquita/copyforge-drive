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

    // Extrair contexto de seleção se existir e limpar da mensagem visível
    const selectionMarker = '**CONTEXTO DOS ELEMENTOS SELECIONADOS:**';
    let cleanMessage = message;
    let selectionContext = '';
    
    if (message.includes(selectionMarker)) {
      const parts = message.split(selectionMarker);
      cleanMessage = parts[0].trim(); // Mensagem sem o contexto
      selectionContext = selectionMarker + parts[1]; // Contexto completo
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
    const { data: generationHistory, error: genHistoryError } = await supabase
      .from('ai_generation_history')
      .select('id, generation_type, generation_category, created_at, prompt, model_used, sessions, original_content')
      .eq('copy_id', copyId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (genHistoryError) {
      console.error('⚠️ Erro ao buscar histórico de gerações:', genHistoryError);
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
    const { data: chatHistory, error: chatHistoryError } = await supabase
      .from('copy_chat_messages')
      .select('role, content, created_at')
      .eq('copy_id', copyId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (chatHistoryError) {
      console.error('⚠️ Erro ao buscar histórico:', chatHistoryError);
    }

    // Construir contexto da copy
    const copyContext = buildCopyContext(copy);

    // Construir contexto do histórico com compressão dinâmica
    const historyContext = buildGenerationHistoryContext(generationHistory || []);
    
    // Verificar se há elementos selecionados na mensagem
    const hasSelection = message.includes('**CONTEXTO DOS ELEMENTOS SELECIONADOS:**');

    // Construir system prompt especializado COM histórico
    const systemPrompt = buildSystemPrompt(copyContext, historyContext, hasSelection);

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
        content: cleanMessage, // Salvar apenas a mensagem sem o contexto de seleção
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

function buildGenerationHistoryContext(history: any[], maxTokens: number = 3000): string {
  if (!history || history.length === 0) {
    return 'Sem histórico de gerações anteriores.';
  }

  let context = `HISTÓRICO DE GERAÇÕES (${history.length} gerações):\n\n`;
  let estimatedTokens = context.length / 4;
  
  const processedHistory: string[] = [];
  
  for (let i = 0; i < history.length; i++) {
    const gen = history[i];
    const timeAgo = getTimeAgo(gen.created_at);
    const genType = getGenerationTypeName(gen.generation_type);
    const category = gen.generation_category || 'Geral';
    
    // Entrada básica
    let entry = `${i + 1}. ${genType} - ${category} (${timeAgo})\n`;
    entry += `   Modelo: ${gen.model_used || 'N/A'}\n`;
    
    // Prompt truncado baseado em espaço disponível
    const remainingTokens = maxTokens - estimatedTokens;
    const promptMaxLength = remainingTokens > 1000 ? 150 : (remainingTokens > 500 ? 100 : 50);
    entry += `   Prompt: "${gen.prompt.substring(0, promptMaxLength)}${gen.prompt.length > promptMaxLength ? '...' : ''}"\n`;
    
    // Seções modificadas (se houver espaço)
    if (gen.original_content && remainingTokens > 500) {
      const affected = getAffectedSessions(gen.sessions, gen.original_content);
      if (affected.length > 0) {
        entry += `   Seções: ${affected.join(', ')}\n`;
      }
    }
    
    entry += `\n`;
    
    const entryTokens = entry.length / 4;
    
    // Parar se exceder limite
    if (estimatedTokens + entryTokens > maxTokens) {
      context += `... (${history.length - i} gerações mais antigas omitidas por limite de tokens)\n`;
      break;
    }
    
    processedHistory.push(entry);
    estimatedTokens += entryTokens;
  }
  
  return context + processedHistory.join('');
}

function getGenerationTypeName(type: string): string {
  const types: Record<string, string> = {
    'create': 'Criação',
    'optimize': 'Otimização',
    'regenerate': 'Variação',
    'expand': 'Expansão',
    'chat': 'Conversa'
  };
  return types[type] || type;
}

function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
  
  return `há ${Math.floor(diffDays / 30)} meses`;
}

function getAffectedSessions(newSessions: any, originalContent: any): string[] {
  const affected: string[] = [];
  
  try {
    const newData = typeof newSessions === 'string' ? JSON.parse(newSessions) : newSessions;
    const oldData = typeof originalContent === 'string' ? JSON.parse(originalContent) : originalContent;
    
    if (Array.isArray(newData) && Array.isArray(oldData)) {
      newData.forEach((session: any, idx: number) => {
        if (oldData[idx]) {
          // Comparação mais inteligente: verifica se os blocos mudaram
          const newBlocks = JSON.stringify(session.blocks || []);
          const oldBlocks = JSON.stringify(oldData[idx].blocks || []);
          
          if (newBlocks !== oldBlocks) {
            affected.push(session.title || `Sessão ${idx + 1}`);
          }
        } else if (session) {
          // Nova sessão adicionada
          affected.push(`${session.title} (nova)` || `Sessão ${idx + 1} (nova)`);
        }
      });
    }
  } catch (e) {
    console.error('⚠️ Erro ao comparar sessões:', e);
  }
  
  return affected;
}

function buildSystemPrompt(copyContext: string, historyContext: string, hasSelection: boolean): string {
  let prompt = `Você é um especialista em copywriting e marketing digital que está ajudando a aprimorar uma copy específica.`;
  
  if (hasSelection) {
    prompt += `\n\n**ATENÇÃO: O usuário selecionou elementos específicos da copy para análise/edição.**
    
Quando elementos estão selecionados:
- Foque sua resposta APENAS nos elementos marcados como "CONTEXTO DOS ELEMENTOS SELECIONADOS"
- Se pedirem para "otimizar", refira-se apenas aos blocos/sessões selecionados
- Se pedirem "criar variação", gere alternativas apenas para o conteúdo selecionado
- Seja específico e direto ao abordar os elementos selecionados
`;
  }
  
  return prompt + `

CONTEXTO DA COPY ATUAL:
${copyContext}

${historyContext}

SEU PAPEL:
- Você é um assistente especializado focado EXCLUSIVAMENTE nesta copy
- Você TEM ACESSO ao histórico completo de gerações e modificações desta copy
- Analise a estrutura e conteúdo atual para dar sugestões contextualizadas
- Use o histórico para entender a evolução e dar feedback mais preciso
- Sugira melhorias de copywriting, estrutura, persuasão e conversão
- Identifique pontos fracos e oportunidades de otimização
- Seja direto, prático e orientado a resultados

CAPACIDADES ESPECIAIS COM HISTÓRICO:
1. **Comparação de Versões**: Quando solicitado, compare o estado atual com versões anteriores
2. **Análise de Evolução**: Identifique padrões nas mudanças e sugira próximos passos
3. **Identificação de Retrocessos**: Alerte se uma mudança recente piorou algo que estava bom
4. **Contexto Completo**: Use prompts anteriores para entender a intenção do usuário
5. **Aprendizado Incremental**: Lembre-se do que já foi testado e evite sugestões repetidas

DIRETRIZES DE USO DO HISTÓRICO:
- Quando o usuário perguntar sobre "antes vs agora", busque no histórico
- Se ele mencionar uma seção específica, identifique mudanças nessa seção
- Ao sugerir otimizações, considere o que já foi tentado
- Se houver muitas mudanças recentes, pergunte sobre os resultados
- Use o histórico para contextualizar suas respostas

DIRETRIZES GERAIS:
1. Mantenha o foco na copy atual - não fale de outros projetos
2. Base suas sugestões na estrutura existente
3. Use princípios de copywriting comprovados (AIDA, PAS, storytelling, etc.)
4. Seja específico - cite seções e blocos exatos ao dar feedback
5. Priorize conversão e clareza na comunicação
6. Considere o tipo de copy ao dar sugestões

IMPORTANTE:
- Você tem memória das conversas anteriores sobre esta copy
- Você tem acesso ao histórico completo de modificações
- Responda de forma conversacional e amigável
- Se o usuário pedir para implementar mudanças, explique que ele pode usar os botões de IA do editor
- Quando sugerir mudanças, seja específico sobre onde e por quê
- Se precisar de mais detalhes sobre uma geração específica, pergunte

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