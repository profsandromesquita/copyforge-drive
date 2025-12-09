import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildPlatformConstraint } from '../_shared/platformLimits.ts';

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
  hasSelection?: boolean;
}

// Mapeamento de copy_type para prompt_key do banco ai_prompt_templates
const COPY_TYPE_TO_PROMPT_KEY: Record<string, string> = {
  anuncio: 'generate_copy_ad',
  landing_page: 'generate_copy_landing_page',
  vsl: 'generate_copy_vsl',
  email: 'generate_copy_email',
  webinar: 'generate_copy_webinar',
  conteudo: 'generate_copy_content',
  mensagem: 'generate_copy_message',
  outro: 'generate_copy_base'
};

/**
 * Valida se uma string é um UUID válido (v4 format)
 * Usado para evitar "vazamento de contexto" quando IDs inválidos estão salvos
 */
function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Busca prompt especializado de OTIMIZAÇÃO ou VARIAÇÃO do banco
 * 
 * Esses prompts contêm instruções ricas de copywriting (clareza radical, 
 * power words, especificidade, etc.) que o modelo precisa para saber
 * COMO otimizar/variar, não apenas formatar.
 */
async function getOptimizationPromptFromDatabase(
  supabase: any, 
  intent: 'replace' | 'insert'
): Promise<string | null> {
  try {
    // Mapear intent para prompt_key correto
    // replace = otimização (melhorar o que existe)
    // insert = variação (explorar novos ângulos)
    const promptKey = intent === 'replace' 
      ? 'optimize_copy_otimizar' 
      : 'optimize_copy_variacao';
    
    console.log(`🔍 Buscando prompt especializado: ${promptKey}`);
    
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('current_prompt, name')
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .single();
    
    if (error || !data?.current_prompt) {
      console.log(`⚠️ Prompt ${promptKey} não encontrado, usando instruções padrão`);
      return null;
    }
    
    console.log(`✅ Prompt "${data.name}" carregado (${data.current_prompt.length} chars)`);
    return data.current_prompt;
  } catch (error) {
    console.error('❌ Erro ao buscar prompt de otimização:', error);
    return null;
  }
}

/**
 * Extrai o conteúdo COMPLETO da copy (sem truncamento)
 * para que o modelo possa VER o que precisa editar/variar
 */
function buildFullCopyContent(sessions: any[]): string {
  if (!sessions || sessions.length === 0) return '[Nenhum conteúdo gerado ainda]';
  
  let fullContent = '';
  sessions.forEach((session, sIdx) => {
    fullContent += `=== ${session.title || `Sessão ${sIdx + 1}`} ===\n\n`;
    (session.blocks || []).forEach((block: any) => {
      if (block.title) {
        fullContent += `**${block.title}**\n`;
      }
      const content = Array.isArray(block.content) 
        ? block.content.map((item: string) => `• ${item}`).join('\n')
        : String(block.content || '');
      fullContent += content + '\n\n';
    });
  });
  return fullContent.trim();
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
    const { copyId, message, hasSelection = false } = body;

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
      cleanMessage = parts[0].trim();
      selectionContext = selectionMarker + parts[1];
    }

    // Buscar dados da copy incluindo system_instruction para herança do Copy IA e platform para limites
    const { data: copy, error: copyError } = await supabase
      .from('copies')
      .select('id, workspace_id, title, copy_type, sessions, selected_audience_id, selected_offer_id, selected_methodology_id, project_id, system_instruction, platform')
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

    // Buscar dados completos do projeto se houver audience ou offer selecionados
    let audienceSegment = null;
    let offer = null;
    let projectIdentity = null;
    let methodology = null;

    if (copy.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', copy.project_id)
        .single();

      if (projectData) {
        projectIdentity = {
          brand_name: projectData.brand_name,
          sector: projectData.sector,
          central_purpose: projectData.central_purpose,
          brand_personality: projectData.brand_personality,
          voice_tones: projectData.voice_tones,
          keywords: projectData.keywords,
        };

        // ✅ GUARDA DE CONTEXTO: Só busca audience se ID for UUID válido
        if (copy.selected_audience_id && isValidUUID(copy.selected_audience_id) && Array.isArray(projectData.audience_segments)) {
          audienceSegment = projectData.audience_segments.find((seg: any) => seg.id === copy.selected_audience_id);
          if (audienceSegment) {
            console.log('✅ Público-alvo carregado:', audienceSegment.who_is?.substring(0, 30));
          }
        } else if (copy.selected_audience_id && !isValidUUID(copy.selected_audience_id)) {
          console.warn('⚠️ selected_audience_id inválido (não é UUID):', copy.selected_audience_id);
        }

        // ✅ GUARDA DE CONTEXTO: Só busca offer se ID for UUID válido
        if (copy.selected_offer_id && isValidUUID(copy.selected_offer_id) && Array.isArray(projectData.offers)) {
          offer = projectData.offers.find((off: any) => off.id === copy.selected_offer_id);
          if (offer) {
            console.log('✅ Oferta carregada:', offer.name?.substring(0, 30));
          }
        } else if (copy.selected_offer_id && !isValidUUID(copy.selected_offer_id)) {
          console.warn('⚠️ selected_offer_id inválido (não é UUID):', copy.selected_offer_id);
        }

        // ✅ GUARDA DE CONTEXTO: Só busca methodology se ID for UUID válido
        if (copy.selected_methodology_id && isValidUUID(copy.selected_methodology_id) && projectData.methodology) {
          const methodologies = Array.isArray(projectData.methodology) 
            ? projectData.methodology 
            : [projectData.methodology];
          
          methodology = methodologies.find((meth: any) => meth.id === copy.selected_methodology_id);
          
          if (methodology) {
            console.log('✅ Metodologia carregada:', methodology.name?.substring(0, 30));
          } else {
            console.warn('⚠️ Metodologia selecionada não encontrada no projeto:', copy.selected_methodology_id);
          }
        } else if (copy.selected_methodology_id && !isValidUUID(copy.selected_methodology_id)) {
          console.warn('⚠️ selected_methodology_id inválido (não é UUID):', copy.selected_methodology_id);
        }
        // ✅ NÃO FAZ MAIS FALLBACK AUTOMÁTICO PARA METODOLOGIA ÚNICA
        // O usuário DEVE selecionar explicitamente
      }
    }

    // ✅ GUARDA MESTRE: Só injeta contexto do projeto se houver seleção explícita
    const hasExplicitContextSelection = !!(audienceSegment || offer || methodology);

    console.log('🔐 Guarda de Contexto:', {
      hasExplicitContextSelection,
      hasProjectIdentity: !!projectIdentity,
      hasAudienceSegment: !!audienceSegment,
      hasOffer: !!offer,
      hasMethodology: !!methodology,
      selectedIds: {
        audience: copy.selected_audience_id,
        offer: copy.selected_offer_id,
        methodology: copy.selected_methodology_id
      }
    });

    // ✅ CORREÇÃO CRÍTICA: Se NENHUM contexto foi selecionado, NÃO injeta projectIdentity
    // Isso previne "vazamento de contexto" onde dados do projeto aparecem sem seleção explícita
    if (!hasExplicitContextSelection && projectIdentity) {
      console.log('⛔ GUARDA ATIVADA: Nenhum contexto selecionado - projectIdentity será ignorado para evitar vazamento');
      projectIdentity = null;
    }

    // Buscar histórico de gerações
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

    // Buscar histórico recente de mensagens
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

    // Construir contexto do histórico
    const historyContext = buildGenerationHistoryContext(generationHistory || []);
    
    // Contar blocos selecionados
    let selectedBlockCount = 0;
    if (hasSelection && selectionContext) {
      const blockMatches = selectionContext.match(/\d+\.\s+\*\*Bloco/g);
      const sessionMatches = selectionContext.match(/\d+\.\s+\*\*Sessão/g);
      selectedBlockCount = (blockMatches?.length || 0) + (sessionMatches?.length || 0);
    }

    // Processar variáveis na mensagem
    const variableContext = {
      projectIdentity,
      audienceSegment,
      offer,
      methodology
    };

    const { enhancedMessage, variableContextText, missingVariables } = parseVariablesInMessage(message, variableContext);

    // Detectar intent ANTES de construir o prompt
    const messageWithoutSelection = cleanMessage;
    const intent = detectUserIntent(messageWithoutSelection, hasSelection);
    
    // Construir system prompt - HERDA do Copy IA quando disponível
    // SMART FALLBACK: Busca prompts ricos do banco se não tiver system_instruction
    const savedSystemInstruction = copy.system_instruction;
    const systemPrompt = await buildEnhancedSystemPrompt(
      supabaseAdmin,
      copy.copy_type || 'outro',
      savedSystemInstruction,
      {
        copyContext,
        historyContext,
        hasSelection,
        selectedBlockCount,
        intent,
        projectIdentity,
        audienceSegment,
        offer,
        methodology,
        variableContextText,
        selectionContext,
        userMessage: cleanMessage, // ✅ Passar mensagem para detecção de quantidade
        platform: copy.platform // ✅ Plataforma para limites de caracteres
      }
    );
    
    console.log(`📋 System Prompt: ${savedSystemInstruction ? 'Herdado do Copy IA' : 'Construído dinamicamente'} (${systemPrompt.length} chars)`);

    // ✅ CORREÇÃO: Extrair quantidade ANTES de construir mensagens
    const itemCount = detectRequestedItemCount(cleanMessage);
    console.log(`📊 Quantidade detectada na mensagem: ${itemCount || 'N/A'}`);

    // ✅ CORREÇÃO: Enriquecer mensagem com quantidade explícita para Function Calling
    let finalUserMessage = enhancedMessage;
    if ((intent === 'insert' || intent === 'replace') && itemCount) {
      finalUserMessage = `[REQUISITO OBRIGATÓRIO: VOCÊ DEVE GERAR EXATAMENTE ${itemCount} BLOCOS SEPARADOS. CADA ITEM DEVE SER UM OBJETO DISTINTO NO ARRAY.]\n\n${enhancedMessage}`;
      console.log(`📝 Mensagem enriquecida com requisito de ${itemCount} blocos`);
    }

    // Construir mensagens para a IA
    const messages: ChatMessage[] = [
      { role: 'user' as const, content: systemPrompt },
      ...(chatHistory || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: finalUserMessage }
    ];

    console.log(`📤 Enviando para Lovable AI: ${messages.length} mensagens, intent: ${intent}`);

    // ============ FUNCTION CALLING: Para insert/replace, usar Tools (sem streaming) ============
    if (intent === 'insert' || intent === 'replace') {
      console.log('🔧 Usando Function Calling (Tools) para garantir estrutura correta');
      
      // ✅ CORREÇÃO: Construir schema dinâmico com restrições de quantidade
      const blocksArraySchema: any = {
        type: "array",
        description: itemCount 
          ? `OBRIGATÓRIO: Este array DEVE conter EXATAMENTE ${itemCount} objetos. NÃO GERE MENOS NEM MAIS.`
          : "Array de blocos. Cada item solicitado DEVE ser um objeto separado.",
        items: {
          type: "object",
          properties: {
            title: { 
              type: "string", 
              description: "Título descritivo curto do bloco (ex: 'E-mail de Boas-Vindas', 'Mensagem Segunda-feira', 'Variação 1')" 
            },
            content: { 
              type: "string", 
              description: "Conteúdo completo do bloco em texto puro (sem markdown, sem JSON)" 
            },
          },
          required: ["title", "content"],
        },
      };
      
      // ✅ CORREÇÃO: Adicionar minItems/maxItems quando quantidade é detectada
      if (itemCount) {
        blocksArraySchema.minItems = itemCount;
        blocksArraySchema.maxItems = itemCount;
        console.log(`🔒 Schema forçado: minItems=${itemCount}, maxItems=${itemCount}`);
      }
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: messages,
          temperature: 0.4,
          tools: [{
            type: "function",
            function: {
              name: "generate_blocks",
              description: itemCount 
                ? `Gera EXATAMENTE ${itemCount} blocos de conteúdo. CADA UM DOS ${itemCount} ITENS SOLICITADOS DEVE SER UM BLOCO SEPARADO.`
                : "Gera blocos de conteúdo estruturados. CADA item solicitado DEVE ser um bloco separado no array.",
              parameters: {
                type: "object",
                properties: {
                  blocks: blocksArraySchema
                },
                required: ["blocks"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_blocks" } },
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('❌ Erro da Lovable AI (Tools):', aiResponse.status, errorText);

        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: 'rate_limit_exceeded', message: 'Limite de requisições excedido.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: 'lovable_ai_credits_required', message: 'Créditos Lovable AI necessários.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        throw new Error(`AI Gateway error: ${aiResponse.status} ${errorText}`);
      }

      const data = await aiResponse.json();
      console.log('📥 Resposta Tools recebida:', JSON.stringify(data).substring(0, 500));

      // Extrair blocos do tool_call
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let generatedBlocks: { title: string; content: string }[] = [];

      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          generatedBlocks = parsed.blocks || [];
          console.log(`✓ Tool call retornou ${generatedBlocks.length} blocos`);
        } catch (parseError) {
          console.error('❌ Erro ao parsear tool_call:', parseError);
        }
      }

      // Fallback: se não conseguiu extrair do tool_call, tentar do content
      if (generatedBlocks.length === 0 && data.choices?.[0]?.message?.content) {
        console.log('⚠️ Fallback: tentando extrair do content');
        const content = data.choices[0].message.content;
        // Tentar parsear como JSON
        try {
          const parsed = JSON.parse(content);
          if (parsed.blocks) {
            generatedBlocks = parsed.blocks;
          }
        } catch {
          // Se não é JSON, criar um bloco único
          generatedBlocks = [{ title: 'Conteúdo Gerado', content: content }];
        }
      }

      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

      // ============ PERSISTÊNCIA ============
      // Salvar mensagem do usuário
      await supabase.from('copy_chat_messages').insert({
        copy_id: copyId,
        workspace_id: workspaceId,
        user_id: userId,
        role: 'user',
        content: cleanMessage,
      });

      // Construir mensagem formatada para histórico
      const formattedMessage = generatedBlocks.map(b => `### ${b.title}\n${b.content}`).join('\n\n');

      // Salvar resposta da IA
      await supabase.from('copy_chat_messages').insert({
        copy_id: copyId,
        workspace_id: workspaceId,
        user_id: userId,
        role: 'assistant',
        content: formattedMessage,
        metadata: { intent, blocksCount: generatedBlocks.length }
      });

      // Debitar créditos
      if (usage.total_tokens > 0) {
        await supabaseAdmin.rpc('debit_workspace_credits', {
          p_workspace_id: workspaceId,
          p_model_name: 'google/gemini-2.5-flash',
          tokens_used: usage.total_tokens || 0,
          p_input_tokens: usage.prompt_tokens || 0,
          p_output_tokens: usage.completion_tokens || 0,
          generation_id: null,
          p_user_id: userId
        });
      }

      console.log(`✓ Function Calling completo: ${generatedBlocks.length} blocos gerados`);

      // Retornar JSON direto com blocos estruturados
      return new Response(JSON.stringify({
        success: true,
        message: formattedMessage,
        blocks: generatedBlocks,
        intent,
        actionable: true,
        tokens: usage,
        missingVariables
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // ============ STREAMING: Para conversacional, manter streaming ============
    console.log('💬 Usando Streaming para resposta conversacional');
    
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
        stream: true,
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
          JSON.stringify({ error: 'lovable_ai_credits_required', message: 'Créditos Lovable AI necessários.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${aiResponse.status} ${errorText}`);
    }

    // ============ STREAMING: Processar resposta em chunks ============
    const reader = aiResponse.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let fullMessage = '';
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Criar TransformStream para processar e reenviar chunks
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Função auxiliar para enviar SSE
    const sendSSE = async (data: any) => {
      const sseMessage = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(sseMessage));
    };

    // Processar stream em background
    (async () => {
      try {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Processar linhas completas do SSE da Lovable AI
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Manter linha incompleta no buffer

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            
            const jsonStr = trimmedLine.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const chunk = JSON.parse(jsonStr);
              const delta = chunk.choices?.[0]?.delta?.content;
              
              if (delta) {
                fullMessage += delta;
                // Reenviar delta para o frontend
                await sendSSE({ delta });
              }

              // Capturar usage se disponível
              if (chunk.usage) {
                usage = chunk.usage;
              }
            } catch {
              // JSON incompleto - ignorar
            }
          }
        }

        console.log('✓ Stream completo, mensagem total:', fullMessage.length, 'caracteres');

        // ============ PERSISTÊNCIA: Salvar após stream completo ============
        
        // Salvar mensagem do usuário
        const { error: userMsgError } = await supabase
          .from('copy_chat_messages')
          .insert({
            copy_id: copyId,
            workspace_id: workspaceId,
            user_id: userId,
            role: 'user',
            content: cleanMessage,
          });

        if (userMsgError) {
          console.error('⚠️ Erro ao salvar mensagem do usuário:', userMsgError);
        }

        // Salvar resposta da IA COM METADATA
        const { error: assistantMsgError } = await supabase
          .from('copy_chat_messages')
          .insert({
            copy_id: copyId,
            workspace_id: workspaceId,
            user_id: userId,
            role: 'assistant',
            content: fullMessage,
            metadata: { intent }
          });

        if (assistantMsgError) {
          console.error('⚠️ Erro ao salvar resposta da IA:', assistantMsgError);
        }

        // Debitar créditos
        if (usage.total_tokens > 0) {
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

        // Determinar se a resposta é acionável
        const isActionable = intent !== 'conversational';

        // Enviar evento final com metadata
        await sendSSE({
          done: true,
          message: fullMessage,
          tokens: usage,
          intent,
          actionable: isActionable,
          missingVariables
        });

        await writer.close();
        console.log('✓ Stream SSE finalizado com sucesso');

      } catch (streamError) {
        console.error('❌ Erro durante streaming:', streamError);
        try {
          await sendSSE({ error: 'Erro durante streaming' });
          await writer.close();
        } catch {
          // Ignorar erro ao fechar
        }
      }
    })();

    // Retornar resposta SSE
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

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
    
    let entry = `${i + 1}. ${genType} - ${category} (${timeAgo})\n`;
    entry += `   Modelo: ${gen.model_used || 'N/A'}\n`;
    
    const remainingTokens = maxTokens - estimatedTokens;
    const promptMaxLength = remainingTokens > 1000 ? 150 : (remainingTokens > 500 ? 100 : 50);
    entry += `   Prompt: "${gen.prompt.substring(0, promptMaxLength)}${gen.prompt.length > promptMaxLength ? '...' : ''}"\n`;
    
    if (gen.original_content && remainingTokens > 500) {
      const affected = getAffectedSessions(gen.sessions, gen.original_content);
      if (affected.length > 0) {
        entry += `   Seções: ${affected.join(', ')}\n`;
      }
    }
    
    entry += `\n`;
    
    const entryTokens = entry.length / 4;
    if (estimatedTokens + entryTokens > maxTokens) {
      break;
    }
    
    processedHistory.push(entry);
    estimatedTokens += entryTokens;
  }
  
  return context + processedHistory.join('');
}

function getAffectedSessions(sessions: any[], originalContent: any): string[] {
  if (!sessions || !originalContent) return [];
  
  const affected: string[] = [];
  sessions.forEach((session: any, idx: number) => {
    affected.push(`Sessão ${idx + 1}`);
  });
  
  return affected.slice(0, 3);
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR');
}

function getGenerationTypeName(type: string): string {
  const types: Record<string, string> = {
    'create': 'Criação',
    'optimize': 'Otimização',
    'variation': 'Variação',
    'chat': 'Chat'
  };
  return types[type] || type || 'Geração';
}

function getCopyTypeName(type: string): string {
  const types: Record<string, string> = {
    'landing_page': 'Landing Page',
    'email': 'E-mail',
    'ad': 'Anúncio',
    'vsl': 'VSL',
    'webinar': 'Webinar',
    'content': 'Conteúdo',
    'message': 'Mensagem'
  };
  return types[type] || type || 'Copy';
}

function getBlockTypeName(type: string): string {
  const types: Record<string, string> = {
    'text': 'Texto',
    'headline': 'Título',
    'subheadline': 'Subtítulo',
    'list': 'Lista',
    'cta': 'CTA',
    'image': 'Imagem',
    'video': 'Vídeo',
    'testimonial': 'Depoimento',
    'faq': 'FAQ'
  };
  return types[type] || type || 'Bloco';
}

// Interface para contexto de variáveis
interface VariableContext {
  projectIdentity: any;
  audienceSegment: any;
  offer: any;
  methodology: any;
}

// Definição centralizada de variáveis
const VARIABLE_DEFINITIONS: Record<string, { path: string; label: string }> = {
  // Identidade do Projeto
  'marca_nome': { path: 'projectIdentity.brand_name', label: 'Nome da Marca' },
  'setor': { path: 'projectIdentity.sector', label: 'Setor de Atuação' },
  'proposito_central': { path: 'projectIdentity.central_purpose', label: 'Propósito Central' },
  'personalidade_marca': { path: 'projectIdentity.brand_personality', label: 'Personalidade da Marca' },
  'tons_voz': { path: 'projectIdentity.voice_tones', label: 'Tons de Voz' },
  'palavras_chave': { path: 'projectIdentity.keywords', label: 'Palavras-Chave' },
  
  // Público-Alvo
  'nome_persona': { path: 'audienceSegment.name', label: 'Nome da Persona' },
  'idade_minima': { path: 'audienceSegment.age_min', label: 'Idade Mínima' },
  'idade_maxima': { path: 'audienceSegment.age_max', label: 'Idade Máxima' },
  'genero': { path: 'audienceSegment.gender', label: 'Gênero' },
  'localizacao': { path: 'audienceSegment.location', label: 'Localização' },
  'renda': { path: 'audienceSegment.income_level', label: 'Nível de Renda' },
  'ocupacao': { path: 'audienceSegment.occupation', label: 'Ocupação' },
  'maior_desejo': { path: 'audienceSegment.biggest_desire', label: 'Maior Desejo' },
  'maior_medo': { path: 'audienceSegment.biggest_fear', label: 'Maior Medo' },
  'principal_objecao': { path: 'audienceSegment.main_objection', label: 'Principal Objeção' },
  'nivel_consciencia': { path: 'audienceSegment.awareness_level', label: 'Nível de Consciência' },
  'sofisticacao': { path: 'audienceSegment.sophistication_level', label: 'Nível de Sofisticação' },
  'dores': { path: 'audienceSegment.pain_points', label: 'Dores' },
  'desejos': { path: 'audienceSegment.desires', label: 'Desejos' },
  'objecoes': { path: 'audienceSegment.objections', label: 'Objeções' },
  
  // Oferta
  'nome_oferta': { path: 'offer.name', label: 'Nome da Oferta' },
  'descricao_oferta': { path: 'offer.description', label: 'Descrição da Oferta' },
  'preco': { path: 'offer.price', label: 'Preço' },
  'preco_original': { path: 'offer.original_price', label: 'Preço Original' },
  'beneficios': { path: 'offer.benefits', label: 'Benefícios' },
  'garantia': { path: 'offer.guarantee', label: 'Garantia' },
  'bonus': { path: 'offer.bonuses', label: 'Bônus' },
  'urgencia': { path: 'offer.urgency', label: 'Urgência' },
  'escassez': { path: 'offer.scarcity', label: 'Escassez' },
  
  // Metodologia
  'nome_metodologia': { path: 'methodology.name', label: 'Nome da Metodologia' },
  'descricao_metodologia': { path: 'methodology.description', label: 'Descrição da Metodologia' },
  'etapas': { path: 'methodology.steps', label: 'Etapas' },
  'diferencial': { path: 'methodology.differentiator', label: 'Diferencial' },
  'resultados': { path: 'methodology.expected_results', label: 'Resultados Esperados' },
};

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value === undefined || value === null) return undefined;
    value = value[key];
  }
  
  return value;
}

function formatValue(value: any): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Mapeia groupKey da variável para o nome amigável do contexto
 */
const CONTEXT_FRIENDLY_NAMES: Record<string, string> = {
  audienceSegment: 'Público-alvo',
  offer: 'Oferta',
  methodology: 'Metodologia',
  projectIdentity: 'Identidade do Projeto'
};

function parseVariablesInMessage(
  message: string, 
  context: VariableContext
): { enhancedMessage: string; variableContextText: string; missingVariables: Array<{ variable: string; label: string }> } {
  const variablePattern = /#(\w+)/g;
  const matches = message.match(variablePattern);
  
  if (!matches || matches.length === 0) {
    return { enhancedMessage: message, variableContextText: '', missingVariables: [] };
  }

  const resolvedVariables: string[] = [];
  const missingVariables: Array<{ variable: string; label: string }> = [];
  let enhancedMessage = message;

  for (const match of matches) {
    const varName = match.substring(1);
    const definition = VARIABLE_DEFINITIONS[varName];
    
    if (!definition) {
      continue;
    }

    const pathParts = definition.path.split('.');
    const contextKey = pathParts[0] as keyof VariableContext;
    const remainingPath = pathParts.slice(1).join('.');
    
    // ✅ GUARDA DE CONTEXTO: Verificar se o contexto foi explicitamente selecionado
    const contextObj = context[contextKey];
    
    // Se o contexto requerido é null/undefined, significa que NÃO foi selecionado
    if (contextObj === null || contextObj === undefined) {
      const friendlyName = CONTEXT_FRIENDLY_NAMES[contextKey] || contextKey;
      missingVariables.push({ 
        variable: varName, 
        label: `${definition.label} (${friendlyName} não selecionado)` 
      });
      enhancedMessage = enhancedMessage.replace(
        match,
        `[⚠️ Selecione um ${friendlyName} nas configurações para usar #${varName}]`
      );
      console.log(`🚫 Variável #${varName} bloqueada: ${friendlyName} não selecionado`);
      continue;
    }
    
    const value = getNestedValue(contextObj, remainingPath);
    
    if (value !== undefined && value !== null && value !== '') {
      const formattedValue = formatValue(value);
      resolvedVariables.push(`${definition.label}: ${formattedValue}`);
      enhancedMessage = enhancedMessage.replace(
        match, 
        `[${definition.label}: ${formattedValue}]`
      );
    } else {
      missingVariables.push({ variable: varName, label: definition.label });
      enhancedMessage = enhancedMessage.replace(
        match,
        `[${definition.label}: DADO NÃO CADASTRADO]`
      );
    }
  }

  let variableContextText = '';
  if (resolvedVariables.length > 0) {
    variableContextText = `\n\n🔖 CONTEXTO DAS VARIÁVEIS MENCIONADAS:\n${resolvedVariables.map(v => `• ${v}`).join('\n')}`;
  }

  return { enhancedMessage, variableContextText, missingVariables };
}

function detectUserIntent(message: string, hasSelection: boolean): 'replace' | 'insert' | 'conversational' | 'default' {
  const lowerMessage = message.toLowerCase().trim();
  
  const creationVerbs = ['criar', 'crie', 'gerar', 'gere', 'fazer', 'faça', 'produzir', 'produza', 'escrever', 'escreva', 'elaborar', 'elabore'];
  const hasCreationVerb = creationVerbs.some(verb => lowerMessage.includes(verb));
  
  // ✅ CORREÇÃO: Definir patterns ANTES do return early
  const replacePatterns = [
    'otimiz', 'melhore', 'melhora', 'reescrev', 'refaz', 'refaç',
    'ajust', 'corrij', 'corrig', 'edit', 'modifiqu', 'alter',
    'substitui', 'substitua', 'troc', 'atualiz', 'reformul'
  ];
  
  const insertPatterns = [
    'varia', 'versão', 'versoes', 'alternativ', 'opç', 'adiciona', 
    'acrescenta', 'complement', 'expanda', 'expand', 'mais'
  ];
  
  // ✅ NOVO: Detectar menção a elemento específico na mensagem
  const mentionsSpecificElement = /(?:bloco|sessão|sessao|conteúdo|conteudo|headline|cta|título|titulo|seção|secao|parágrafo|paragrafo|texto)(?:\s+(?:do|da|de|sobre|#?\d+|\d+)|\s*\d+)/i.test(lowerMessage);
  
  const isReplace = replacePatterns.some(p => lowerMessage.includes(p));
  const isInsert = insertPatterns.some(p => lowerMessage.includes(p));
  
  if (!hasSelection) {
    // ✅ CORREÇÃO: Se menciona elemento + verbo de otimização → 'replace'
    if (isReplace && mentionsSpecificElement) {
      console.log('🎯 Intent detectado: replace (menção a elemento + verbo de otimização, sem seleção visual)');
      return 'replace';
    }
    // ✅ CORREÇÃO: Se menciona elemento + verbo de criação/inserção → 'insert'
    if ((hasCreationVerb || isInsert) && mentionsSpecificElement) {
      console.log('🎯 Intent detectado: insert (menção a elemento + verbo de criação, sem seleção visual)');
      return 'insert';
    }
    // Verbo de criação ou inserção sem elemento específico → 'insert'
    if (hasCreationVerb || isInsert) {
      return 'insert';
    }
    return 'conversational';
  }
  
  const conversationalPatterns = [
    'o que', 'qual', 'como', 'porque', 'por que', 'quando',
    'explique', 'explica', 'me conte', 'me fale', 'diga',
    'analise', 'analisa', 'avalie', 'avalia', 'compare',
    'você acha', 'vc acha', 'opinião', 'opiniao',
    '?'
  ];
  
  const isConversational = conversationalPatterns.some(p => lowerMessage.includes(p));
  if (isConversational && !hasCreationVerb) {
    return 'conversational';
  }
  
  if (isReplace && !isInsert) return 'replace';
  if (isInsert && !isReplace) return 'insert';
  if (isReplace && isInsert) return 'replace';
  
  if (hasCreationVerb) return 'insert';
  
  return 'default';
}

// Interface para parâmetros do system prompt dinâmico
interface DynamicPromptParams {
  copyContext: string;
  historyContext: string;
  hasSelection: boolean;
  selectedBlockCount: number;
  intent: 'replace' | 'insert' | 'conversational' | 'default';
  projectIdentity: any;
  audienceSegment: any;
  offer: any;
  methodology: any;
  variableContextText: string;
  selectionContext: string;
  userMessage: string; // ✅ Mensagem do usuário para detectar quantidade de itens
  platform?: string; // Plataforma de destino para limites de caracteres
}

/**
 * Constrói o System Prompt com herança do Copy IA quando disponível.
 * 
 * ESTRATÉGIA:
 * 1. Se system_instruction existe (veio do Copy IA): Usa como BASE RICA
 *    e adiciona apenas seções dinâmicas (seleção, intent, histórico recente)
 * 2. Se system_instruction é NULL (usuário foi direto ao chat): 
 *    SMART FALLBACK → Busca prompt rico do banco ai_prompt_templates
 * 3. Se não encontrar no banco: Fallback genérico
 */
async function buildEnhancedSystemPrompt(
  supabase: any,
  copyType: string,
  savedSystemInstruction: any,
  params: DynamicPromptParams
): Promise<string> {
  const {
    copyContext,
    historyContext,
    hasSelection,
    selectedBlockCount,
    intent,
    projectIdentity,
    audienceSegment,
    offer,
    methodology,
    variableContextText,
    selectionContext,
    userMessage
  } = params;

  // ============ CENÁRIO 1: Herdar do Copy IA ============
  if (savedSystemInstruction) {
    // Extrair o texto do system instruction (pode ser objeto ou string)
    let basePrompt = '';
    if (typeof savedSystemInstruction === 'string') {
      basePrompt = savedSystemInstruction;
    } else if (savedSystemInstruction.full_text) {
      basePrompt = savedSystemInstruction.full_text;
    } else if (savedSystemInstruction.base_prompt) {
      // Reconstruir a partir das partes se necessário
      basePrompt = savedSystemInstruction.base_prompt;
      if (savedSystemInstruction.project_context) {
        basePrompt += '\n\n' + savedSystemInstruction.project_context;
      }
      if (savedSystemInstruction.audience_context) {
        basePrompt += '\n\n' + savedSystemInstruction.audience_context;
      }
      if (savedSystemInstruction.offer_context) {
        basePrompt += '\n\n' + savedSystemInstruction.offer_context;
      }
      if (savedSystemInstruction.methodology_context) {
        basePrompt += '\n\n' + savedSystemInstruction.methodology_context;
      }
      if (savedSystemInstruction.characteristics_context) {
        basePrompt += '\n\n' + savedSystemInstruction.characteristics_context;
      }
    } else {
      // Fallback: converter objeto para string se estrutura desconhecida
      basePrompt = JSON.stringify(savedSystemInstruction);
    }

    console.log('🔗 Herdando System Instruction do Copy IA:', basePrompt.length, 'chars');

    // Adicionar seções dinâmicas ao prompt herdado
    let enhancedPrompt = basePrompt;

    // Adicionar contexto da estrutura atual (pode ter mudado desde a geração)
    enhancedPrompt += `\n\n---
⚡ ATUALIZAÇÕES DINÂMICAS DESTA SESSÃO DE CHAT:

📋 ESTRUTURA ATUAL DA COPY:
${copyContext}

📚 HISTÓRICO RECENTE:
${historyContext}
`;

    // Adicionar contexto de variáveis resolvidas
    if (variableContextText) {
      enhancedPrompt += variableContextText;
    }

    // Adicionar contexto de seleção
    if (hasSelection && selectionContext) {
      enhancedPrompt += `\n\n🎯 FOCO DA CONVERSA:
O usuário selecionou ${selectedBlockCount} elemento(s) específico(s) para trabalhar.

${selectionContext}

IMPORTANTE: Foque sua resposta EXCLUSIVAMENTE nos elementos selecionados acima.
`;
    }

    // ✅ NOVO: Injetar prompt especializado de OTIMIZAÇÃO/VARIAÇÃO quando intent é replace/insert
    if (intent === 'replace' || intent === 'insert') {
      const specializedPrompt = await getOptimizationPromptFromDatabase(supabase, intent);
      if (specializedPrompt) {
        // Obter conteúdo completo da copy para edição
        const sessions = params.copyContext ? [] : []; // sessions virá do copy original
        
        enhancedPrompt += `\n\n${'='.repeat(60)}
🎯 INSTRUÇÕES ESPECIALIZADAS DE ${intent === 'replace' ? 'OTIMIZAÇÃO' : 'VARIAÇÃO'}:
${'='.repeat(60)}

${specializedPrompt}

📄 CONTEÚDO ATUAL COMPLETO QUE VOCÊ DEVE ${intent === 'replace' ? 'OTIMIZAR' : 'USAR COMO BASE PARA VARIAÇÃO'}:
---INÍCIO DO CONTEÚDO---
${copyContext}
---FIM DO CONTEÚDO---

⚠️ REGRA CRÍTICA: 
- NÃO copie o texto acima literalmente
- ${intent === 'replace' ? 'MODIFIQUE aplicando as técnicas de otimização' : 'CRIE uma variação explorando novo ângulo/estrutura'}
- Mantenha a ESSÊNCIA e o TEMA original
- Se o usuário pediu limite de caracteres, CONTE e RESPEITE
`;
        console.log(`🎯 Prompt especializado de ${intent} injetado`);
      }
    }

    // Adicionar modo de operação (com mensagem do usuário para detectar quantidade de itens)
    enhancedPrompt += buildIntentInstructions(intent, userMessage);

    // ✅ REGRAS DE FORMATAÇÃO CONDICIONAIS - Só aplicar "NUNCA use ##" para conversacional
    // Para insert/replace, as regras de ### já estão em buildIntentInstructions()
    if (intent === 'conversational' || intent === 'default') {
      enhancedPrompt += `\n\n📝 REGRAS DE FORMATAÇÃO PARA CHAT:
1. Escreva texto limpo e direto
2. Use quebras de linha simples para separar parágrafos
3. NÃO use formatação ### para respostas conversacionais
4. Seja objetivo e útil
`;
    }

    // ✅ RESTRIÇÃO DE PLATAFORMA (Negative Constraint - adicionada ao FINAL)
    if (params.platform) {
      const platformConstraint = buildPlatformConstraint(params.platform);
      if (platformConstraint) {
        enhancedPrompt += '\n\n' + platformConstraint;
        console.log(`📱 Restrição de plataforma injetada: ${params.platform}`);
      }
    }

    return enhancedPrompt;
  }

  // ============ CENÁRIO 2: SMART FALLBACK - Buscar prompt rico do banco ============
  console.log('⚠️ Sem System Instruction salvo, ativando Smart Fallback...');
  return await buildSmartFallbackSystemPrompt(supabase, copyType, params);
}

/**
 * SMART FALLBACK: Busca prompt rico do banco antes de usar genérico
 * 
 * Hierarquia:
 * 1º → ai_prompt_templates pelo copy_type (prompts ricos específicos)
 * 2º → buildFallbackSystemPrompt genérico (último recurso)
 */
async function buildSmartFallbackSystemPrompt(
  supabase: any,
  copyType: string,
  params: DynamicPromptParams
): Promise<string> {
  
  // 1. Mapear copy_type para prompt_key
  const promptKey = COPY_TYPE_TO_PROMPT_KEY[copyType] || 'generate_copy_base';
  console.log(`🔍 Smart Fallback: Buscando prompt "${promptKey}" para tipo "${copyType}"`);
  
  // 2. Buscar template rico do banco
  const { data: template, error } = await supabase
    .from('ai_prompt_templates')
    .select('current_prompt, system_instructions, name')
    .eq('prompt_key', promptKey)
    .eq('is_active', true)
    .single();
  
  // 3. Se encontrou, usar como BASE RICA
  if (template && !error) {
    console.log(`✅ Template encontrado: "${template.name}" (${template.current_prompt?.length || 0} chars)`);
    
    // ✅ CORREÇÃO CRÍTICA: Usar APENAS current_prompt (conteúdo rico de copywriting)
    // ❌ NÃO usar system_instructions - contém instruções JSON que conflitam com formato ### do Chat
    // As instruções de formato ### virão EXCLUSIVAMENTE de buildIntentInstructions()
    const richBasePrompt = template.current_prompt || '';
    
    // Enriquecer com contexto dinâmico (agora assíncrono para buscar prompts especializados)
    return await enrichWithDynamicContext(supabase, richBasePrompt, params, copyType);
  }
  
  // 4. Se não encontrou, fallback genérico (último recurso)
  console.log(`⚠️ Template "${promptKey}" não encontrado, usando fallback genérico`);
  return buildFallbackSystemPrompt(params);
}

/**
 * Enriquece o prompt base do banco com contexto dinâmico da sessão
 * AGORA ASSÍNCRONO: Busca prompts especializados de otimização/variação
 */
async function enrichWithDynamicContext(
  supabase: any,
  basePrompt: string,
  params: DynamicPromptParams,
  copyType: string
): Promise<string> {
  const {
    copyContext,
    historyContext,
    hasSelection,
    selectedBlockCount,
    intent,
    projectIdentity,
    audienceSegment,
    offer,
    methodology,
    variableContextText,
    selectionContext,
    userMessage
  } = params;

  let enrichedPrompt = basePrompt;

  // Adicionar tipo de copy para contexto
  enrichedPrompt += `\n\n📌 TIPO DE COPY: ${getCopyTypeName(copyType).toUpperCase()}`;

  // Adicionar contexto da estrutura atual
  enrichedPrompt += `\n\n📋 ESTRUTURA ATUAL DA COPY:
${copyContext}

📚 HISTÓRICO RECENTE:
${historyContext}
`;

  // Contexto do projeto (se disponível)
  if (projectIdentity) {
    enrichedPrompt += `\n📊 CONTEXTO DO PROJETO:
• Marca: ${projectIdentity.brand_name || 'Não definido'}
• Setor: ${projectIdentity.sector || 'Não definido'}
• Propósito: ${projectIdentity.central_purpose || 'Não definido'}
• Personalidade: ${Array.isArray(projectIdentity.brand_personality) ? projectIdentity.brand_personality.join(', ') : 'Não definido'}
• Tons de Voz: ${Array.isArray(projectIdentity.voice_tones) ? projectIdentity.voice_tones.join(', ') : 'Não definido'}
`;
  }

  // Público-alvo (se disponível)
  if (audienceSegment) {
    enrichedPrompt += `\n👥 PÚBLICO-ALVO:
• Persona: ${audienceSegment.name || 'Não definido'}
• Maior Desejo: ${audienceSegment.biggest_desire || 'Não definido'}
• Maior Medo: ${audienceSegment.biggest_fear || 'Não definido'}
• Principal Objeção: ${audienceSegment.main_objection || 'Não definido'}
• Nível de Consciência: ${audienceSegment.awareness_level || 'Não definido'}
`;
  }

  // Oferta (se disponível)
  if (offer) {
    enrichedPrompt += `\n🎯 OFERTA:
• Nome: ${offer.name || 'Não definido'}
• Descrição: ${offer.description || 'Não definido'}
• Preço: ${offer.price || 'Não definido'}
• Garantia: ${offer.guarantee || 'Não definido'}
`;
  }

  // Metodologia (se disponível)
  if (methodology) {
    enrichedPrompt += `\n🧠 METODOLOGIA:
• Nome: ${methodology.name || 'Não definido'}
• Descrição: ${methodology.description || 'Não definido'}
• Diferencial: ${methodology.differentiator || 'Não definido'}
`;
  }

  // Variáveis resolvidas
  if (variableContextText) {
    enrichedPrompt += variableContextText;
  }

  // Seleção (se houver)
  if (hasSelection && selectionContext) {
    enrichedPrompt += `\n\n🎯 FOCO DA CONVERSA:
O usuário selecionou ${selectedBlockCount} elemento(s) específico(s) para trabalhar.

${selectionContext}

IMPORTANTE: Foque sua resposta EXCLUSIVAMENTE nos elementos selecionados acima.
`;
  }

  // ✅ NOVO: Injetar prompt especializado de OTIMIZAÇÃO/VARIAÇÃO quando intent é replace/insert
  if (intent === 'replace' || intent === 'insert') {
    const specializedPrompt = await getOptimizationPromptFromDatabase(supabase, intent);
    if (specializedPrompt) {
      enrichedPrompt += `\n\n${'='.repeat(60)}
🎯 INSTRUÇÕES ESPECIALIZADAS DE ${intent === 'replace' ? 'OTIMIZAÇÃO' : 'VARIAÇÃO'}:
${'='.repeat(60)}

${specializedPrompt}

📄 CONTEÚDO ATUAL COMPLETO QUE VOCÊ DEVE ${intent === 'replace' ? 'OTIMIZAR' : 'USAR COMO BASE PARA VARIAÇÃO'}:
---INÍCIO DO CONTEÚDO---
${copyContext}
---FIM DO CONTEÚDO---

⚠️ REGRA CRÍTICA: 
- NÃO copie o texto acima literalmente
- ${intent === 'replace' ? 'MODIFIQUE aplicando as técnicas de otimização' : 'CRIE uma variação explorando novo ângulo/estrutura'}
- Mantenha a ESSÊNCIA e o TEMA original
- Se o usuário pediu limite de caracteres, CONTE e RESPEITE
`;
      console.log(`🎯 Prompt especializado de ${intent} injetado via enrichWithDynamicContext`);
    }
  }

  // Regras de formatação - CONDICIONAIS ao intent
  // Para insert/replace, as regras de formatação vão em buildIntentInstructions()
  if (intent === 'conversational' || intent === 'default') {
    enrichedPrompt += `\n\n📝 REGRAS DE FORMATAÇÃO PARA RESPOSTAS CONVERSACIONAIS:
1. Escreva texto limpo e direto
2. Use quebras de linha simples para separar parágrafos
3. Seja objetivo e útil
4. NÃO gere blocos estruturados com ###
`;
  }

  // Instruções de intent (incluem regras de formatação para insert/replace)
  // Passa userMessage para detectar quantidade de itens solicitados
  enrichedPrompt += buildIntentInstructions(intent, userMessage);

  // ✅ RESTRIÇÃO DE PLATAFORMA (Negative Constraint - adicionada ao FINAL)
  if (params.platform) {
    const platformConstraint = buildPlatformConstraint(params.platform);
    if (platformConstraint) {
      enrichedPrompt += '\n\n' + platformConstraint;
      console.log(`📱 Restrição de plataforma injetada via enrichWithDynamicContext: ${params.platform}`);
    }
  }

  return enrichedPrompt;
}

/**
 * Detecta quantos itens o usuário solicitou na mensagem
 * Ex: "7 mensagens", "5 emails", "3 variações" → retorna número
 */
function detectRequestedItemCount(message: string): number | null {
  const patterns = [
    /(\d+)\s*(?:mensagens?|emails?|e-mails?|variações?|variacoes?|opções?|opcoes?|blocos?|itens?|dias?|posts?|textos?|copies?|headlines?|ctas?|scripts?|roteiros?)/i,
    /(?:crie|gere|faça|faca|escreva|produza|elabore)\s*(\d+)/i,
    /(?:para\s*)?(?:cada|todos?\s*os?)\s*(\d+)\s*dias?/i,
    /(?:sequência|sequencia)\s*de\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const count = parseInt(match[1]);
      if (count >= 2 && count <= 30) return count; // Limite razoável
    }
  }
  return null;
}

/**
 * Gera instruções específicas baseadas no intent detectado
 * CRÍTICO: Para intents 'insert' e 'replace', inclui formatação obrigatória
 * com ### que o parser (ai-content-parser.ts) consegue reconhecer
 */
function buildIntentInstructions(
  intent: 'replace' | 'insert' | 'conversational' | 'default',
  userMessage: string = ''
): string {
  const itemCount = detectRequestedItemCount(userMessage);
  
  if (intent === 'replace') {
    return `\n\n🔄 MODO: SUBSTITUIÇÃO - CONTEÚDO ESTRUTURADO
O usuário quer SUBSTITUIR o conteúdo selecionado.

🎯 FORMATO OBRIGATÓRIO DA RESPOSTA:
Para que seu conteúdo substitua corretamente, você DEVE:
1. Gerar conteúdo que SUBSTITUA diretamente o selecionado
2. Começar CADA bloco com ### seguido do título descritivo
3. Manter a mesma quantidade de blocos que foi selecionada

📋 EXEMPLO DE FORMATO CORRETO (3 blocos):
### Bloco 1: Headline Otimizada
[Conteúdo otimizado aqui, texto limpo sem explicações]

### Bloco 2: Subheadline
[Conteúdo do segundo bloco aqui]

### Bloco 3: CTA
[Conteúdo do terceiro bloco aqui]

⚠️ REGRAS CRÍTICAS:
- NUNCA responda em formato JSON
- NUNCA agrupe múltiplos blocos em um só
- CADA bloco = 1 seção ### separada
- Mantenha o mesmo propósito/função do conteúdo original
- NÃO inicie com "Aqui está..." ou explicações
- NÃO termine com "Quer que eu ajuste..." ou perguntas
- Se 1 bloco foi selecionado, gere 1 bloco começando com ###
`;
  } else if (intent === 'insert') {
    const itemCountStr = itemCount ? `${itemCount} ITENS` : 'MÚLTIPLOS ITENS';

    return `\n\n➕ MODO: INSERÇÃO DE ${itemCountStr}

🚨🚨🚨 REGRA DE OURO - VIOLAÇÃO = FALHA CRÍTICA 🚨🚨🚨
${itemCount || 'N'} ITENS PEDIDOS = ${itemCount || 'N'} LINHAS COMEÇANDO COM ###
NÃO EXISTE EXCEÇÃO. CADA ITEM É UM ### SEPARADO.

🔴🔴🔴 ANTI-PADRÃO PROIBIDO (DETECTAMOS E REJEITAMOS) 🔴🔴🔴
### Mensagens para a semana ← TÍTULO GENÉRICO AGRUPADOR = ERRO FATAL
Mensagem 1: Segunda-feira...
Mensagem 2: Terça-feira...
Mensagem 3: Quarta-feira...

👆 ISSO GERA 1 BLOCO COM 7 ITENS DENTRO = INUTILIZÁVEL
O SISTEMA VAI REJEITAR ESTE FORMATO.

✅✅✅ FORMATO CORRETO OBRIGATÓRIO ✅✅✅
### Mensagem 1: Segunda-feira - 7 dias
Texto completo da primeira mensagem aqui, pronto para uso.

### Mensagem 2: Terça-feira - 6 dias  
Texto completo da segunda mensagem aqui, pronto para uso.

### Mensagem 3: Quarta-feira - 5 dias
Texto completo da terceira mensagem aqui, pronto para uso.

### Mensagem 4: Quinta-feira - 4 dias
Texto completo da quarta mensagem aqui, pronto para uso.

### Mensagem 5: Sexta-feira - 3 dias
Texto completo da quinta mensagem aqui, pronto para uso.

### Mensagem 6: Sábado - 2 dias
Texto completo da sexta mensagem aqui, pronto para uso.

### Mensagem 7: Domingo - 1 dia
Texto completo da sétima mensagem aqui, pronto para uso.

⚠️ VERIFICAÇÃO FINAL OBRIGATÓRIA:
- Conte quantos ### você escreveu na sua resposta
- Se pediram ${itemCount || 'N'} itens, deve haver EXATAMENTE ${itemCount || 'N'} linhas começando com ###
- CADA mensagem/item = NOVA LINHA com ### no início
- NUNCA junte múltiplos itens após um único ###
- NUNCA use formato JSON ou código
- NÃO inicie com "Aqui estão..." ou explicações
- O conteúdo deve estar PRONTO para uso, texto limpo

🚨 REPITO: ${itemCount || 'N'} ITENS = ${itemCount || 'N'} LINHAS COM ### 🚨
`;
  } else if (intent === 'conversational') {
    return `\n\n💬 MODO: CONVERSA
O usuário está fazendo uma pergunta ou pedindo análise.
- Responda de forma conversacional e útil
- NÃO gere conteúdo estruturado com ###
- NÃO gere blocos de copy
- Foque em esclarecer, analisar, dar feedback ou aconselhar
- Seja direto e objetivo na resposta
`;
  } else {
    return `\n\n⚡ MODO: ASSISTÊNCIA GERAL
Analise o pedido do usuário e responda adequadamente.

Se for pedido de CRIAÇÃO (criar, gerar, fazer, escrever):
- Use ### no início de CADA bloco/item gerado
- CADA item solicitado = 1 seção ### separada
- Exemplo para 3 itens: ### Item 1: Título, ### Item 2: Título, ### Item 3: Título
- NUNCA use JSON

Se for PERGUNTA ou ANÁLISE:
- Responda de forma conversacional, sem ###
- Foque em ajudar e esclarecer
`;
  }
}

/**
 * Fallback: Constrói prompt genérico quando não há system_instruction salvo
 * (usuário foi direto ao chat sem passar pelo Copy IA)
 */
function buildFallbackSystemPrompt(params: DynamicPromptParams): string {
  const {
    copyContext,
    historyContext,
    hasSelection,
    selectedBlockCount,
    intent,
    projectIdentity,
    audienceSegment,
    offer,
    methodology,
    variableContextText,
    selectionContext,
    userMessage
  } = params;

  let systemPrompt = `Você é um copywriter especialista trabalhando em uma plataforma de criação de copy.
Você está em um CHAT COLABORATIVO onde ajuda o usuário a criar e refinar textos.

📋 CONTEXTO DA COPY ATUAL:
${copyContext}

📚 HISTÓRICO DE TRABALHO:
${historyContext}
`;

  if (projectIdentity) {
    systemPrompt += `\n📊 CONTEXTO DO PROJETO:
• Marca: ${projectIdentity.brand_name || 'Não definido'}
• Setor: ${projectIdentity.sector || 'Não definido'}
• Propósito: ${projectIdentity.central_purpose || 'Não definido'}
• Personalidade: ${Array.isArray(projectIdentity.brand_personality) ? projectIdentity.brand_personality.join(', ') : 'Não definido'}
• Tons de Voz: ${Array.isArray(projectIdentity.voice_tones) ? projectIdentity.voice_tones.join(', ') : 'Não definido'}
`;
  }

  if (audienceSegment) {
    systemPrompt += `\n👥 PÚBLICO-ALVO SELECIONADO:
• Persona: ${audienceSegment.name || 'Não definido'}
• Maior Desejo: ${audienceSegment.biggest_desire || 'Não definido'}
• Maior Medo: ${audienceSegment.biggest_fear || 'Não definido'}
• Principal Objeção: ${audienceSegment.main_objection || 'Não definido'}
• Nível de Consciência: ${audienceSegment.awareness_level || 'Não definido'}
`;
  }

  if (offer) {
    systemPrompt += `\n🎯 OFERTA SELECIONADA:
• Nome: ${offer.name || 'Não definido'}
• Descrição: ${offer.description || 'Não definido'}
• Preço: ${offer.price || 'Não definido'}
• Garantia: ${offer.guarantee || 'Não definido'}
`;
  }

  if (methodology) {
    systemPrompt += `\n🧠 METODOLOGIA SELECIONADA:
• Nome: ${methodology.name || 'Não definido'}
• Descrição: ${methodology.description || 'Não definido'}
• Diferencial: ${methodology.differentiator || 'Não definido'}
`;
  }

  if (variableContextText) {
    systemPrompt += variableContextText;
  }

  if (hasSelection && selectionContext) {
    systemPrompt += `\n\n🎯 FOCO DA CONVERSA:
O usuário selecionou ${selectedBlockCount} elemento(s) específico(s) para trabalhar.

${selectionContext}

IMPORTANTE: Foque sua resposta EXCLUSIVAMENTE nos elementos selecionados acima.
`;
  }

  // ✅ REGRAS DE FORMATAÇÃO CONDICIONAIS - Só aplicar "NUNCA use ##" para conversacional
  // Para insert/replace, as regras de ### já estão em buildIntentInstructions()
  if (intent === 'conversational' || intent === 'default') {
    systemPrompt += `\n📝 REGRAS DE FORMATAÇÃO PARA RESPOSTAS CONVERSACIONAIS:
1. Escreva texto limpo e direto
2. Use quebras de linha simples para separar parágrafos
3. NÃO use formatação ### para respostas conversacionais
4. Seja objetivo e útil
`;
  }

  systemPrompt += buildIntentInstructions(intent, userMessage);

  return systemPrompt;
}
