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

    // Buscar dados da copy incluindo selected_audience_id e selected_offer_id
    const { data: copy, error: copyError } = await supabase
      .from('copies')
      .select('id, workspace_id, title, copy_type, sessions, selected_audience_id, selected_offer_id, project_id')
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

        // Buscar audience segment se selecionado
        if (copy.selected_audience_id && Array.isArray(projectData.audience_segments)) {
          audienceSegment = projectData.audience_segments.find((seg: any) => seg.id === copy.selected_audience_id);
        }

        // Buscar offer se selecionado
        if (copy.selected_offer_id && Array.isArray(projectData.offers)) {
          offer = projectData.offers.find((off: any) => off.id === copy.selected_offer_id);
        }

        // Buscar metodologia se disponível
        if (projectData.methodology) {
          methodology = projectData.methodology;
        }
      }
    }

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

    // ==================== SISTEMA DE VARIÁVEIS ====================
    // Processar variáveis na mensagem
    const variableContext = {
      projectIdentity,
      audienceSegment,
      offer,
      methodology
    };

    const { enhancedMessage, variableContextText } = parseVariablesInMessage(message, variableContext);

    // Construir system prompt especializado COM histórico, contexto e variáveis
    const systemPrompt = buildSystemPrompt(
      copyContext, 
      historyContext, 
      hasSelection, 
      projectIdentity, 
      audienceSegment, 
      offer,
      methodology,
      variableContextText // NOVO: contexto de variáveis
    );

    // Construir mensagens para a IA
    const messages: ChatMessage[] = [
      { role: 'user' as const, content: systemPrompt },
      ...(chatHistory || []).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: enhancedMessage } // Usar mensagem original (variáveis são processadas no system prompt)
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

// ==================== SISTEMA DE VARIÁVEIS CONTEXTUAIS ====================

interface VariableContext {
  projectIdentity: any;
  audienceSegment: any;
  offer: any;
  methodology: any;
}

function parseVariablesInMessage(
  message: string, 
  context: VariableContext
): { enhancedMessage: string; variableContextText: string } {
  
  const variableRegex = /#([a-zA-Z_]+)/g;
  const matches = Array.from(message.matchAll(variableRegex));
  
  if (matches.length === 0) {
    return { enhancedMessage: message, variableContextText: '' };
  }
  
  // Mapeamento completo de variáveis
  const variableDefinitions: Record<string, { path: string; label: string }> = {
    // PROJETO
    nome_marca: { path: 'projectIdentity.brand_name', label: 'Nome da Marca' },
    setor: { path: 'projectIdentity.sector', label: 'Setor' },
    proposito: { path: 'projectIdentity.central_purpose', label: 'Propósito' },
    personalidade: { path: 'projectIdentity.brand_personality', label: 'Personalidade' },
    tom_voz: { path: 'projectIdentity.voice_tones', label: 'Tom de Voz' },
    palavras_chave: { path: 'projectIdentity.keywords', label: 'Palavras-chave' },
    
    // PÚBLICO-ALVO (Manual)
    quem_e: { path: 'audienceSegment.who_is', label: 'Quem É' },
    maior_desejo: { path: 'audienceSegment.biggest_desire', label: 'Maior Desejo' },
    maior_dor: { path: 'audienceSegment.biggest_pain', label: 'Maior Dor' },
    tentativas_falhadas: { path: 'audienceSegment.failed_attempts', label: 'Tentativas Falhadas' },
    crencas: { path: 'audienceSegment.beliefs', label: 'Crenças' },
    comportamento: { path: 'audienceSegment.behavior', label: 'Comportamento' },
    jornada: { path: 'audienceSegment.journey', label: 'Jornada' },
    
    // PÚBLICO-ALVO (Análise Avançada)
    perfil_psicografico: { path: 'audienceSegment.advanced_analysis.psychographic_profile', label: 'Perfil Psicográfico' },
    nivel_consciencia: { path: 'audienceSegment.advanced_analysis.consciousness_level', label: 'Nível de Consciência' },
    estado_emocional: { path: 'audienceSegment.advanced_analysis.emotional_state', label: 'Estado Emocional' },
    dor_oculta: { path: 'audienceSegment.advanced_analysis.hidden_pain', label: 'Dor Oculta' },
    medo_primario: { path: 'audienceSegment.advanced_analysis.primary_fear', label: 'Medo Primário' },
    desejo_emocional: { path: 'audienceSegment.advanced_analysis.emotional_desire', label: 'Desejo Emocional' },
    percepcao_problema: { path: 'audienceSegment.advanced_analysis.problem_misperception', label: 'Percepção Errônea' },
    mecanismo_interno: { path: 'audienceSegment.advanced_analysis.internal_mechanism', label: 'Mecanismo Interno' },
    crenca_limitante: { path: 'audienceSegment.advanced_analysis.limiting_belief', label: 'Crença Limitante' },
    narrativa_interna: { path: 'audienceSegment.advanced_analysis.internal_narrative', label: 'Narrativa Interna' },
    contradicao_interna: { path: 'audienceSegment.advanced_analysis.internal_contradiction', label: 'Contradição Interna' },
    comportamento_dominante: { path: 'audienceSegment.advanced_analysis.dominant_behavior', label: 'Comportamento Dominante' },
    gatilho_decisao: { path: 'audienceSegment.advanced_analysis.decision_trigger', label: 'Gatilho de Decisão' },
    estilo_comunicacao: { path: 'audienceSegment.advanced_analysis.communication_style', label: 'Estilo de Comunicação' },
    resistencias_psicologicas: { path: 'audienceSegment.advanced_analysis.psychological_resistances', label: 'Resistências Psicológicas' },
    
    // GATILHOS MENTAIS
    escassez: { path: 'audienceSegment.advanced_analysis.mental_triggers.escassez', label: 'Gatilho: Escassez' },
    autoridade: { path: 'audienceSegment.advanced_analysis.mental_triggers.autoridade', label: 'Gatilho: Autoridade' },
    prova_social: { path: 'audienceSegment.advanced_analysis.mental_triggers.prova_social', label: 'Gatilho: Prova Social' },
    reciprocidade: { path: 'audienceSegment.advanced_analysis.mental_triggers.reciprocidade', label: 'Gatilho: Reciprocidade' },
    consistencia: { path: 'audienceSegment.advanced_analysis.mental_triggers.consistencia', label: 'Gatilho: Consistência' },
    afinidade: { path: 'audienceSegment.advanced_analysis.mental_triggers.afinidade', label: 'Gatilho: Afinidade' },
    antecipacao: { path: 'audienceSegment.advanced_analysis.mental_triggers.antecipacao', label: 'Gatilho: Antecipação' },
    exclusividade: { path: 'audienceSegment.advanced_analysis.mental_triggers.exclusividade', label: 'Gatilho: Exclusividade' },
    
    // OFERTA
    nome: { path: 'offer.name', label: 'Nome da Oferta' },
    tipo: { path: 'offer.type', label: 'Tipo da Oferta' },
    descricao: { path: 'offer.short_description', label: 'Descrição' },
    beneficio_principal: { path: 'offer.main_benefit', label: 'Benefício Principal' },
    mecanismo_unico: { path: 'offer.unique_mechanism', label: 'Mecanismo Único' },
    diferenciais: { path: 'offer.differentials', label: 'Diferenciais' },
    prova_autoridade: { path: 'offer.proof', label: 'Prova/Autoridade' },
    garantia: { path: 'offer.guarantee', label: 'Garantia' },
    cta: { path: 'offer.cta', label: 'Call to Action' },
    
    // METODOLOGIA
    nome_metodologia: { path: 'methodology.name', label: 'Nome da Metodologia' },
    tese_central: { path: 'methodology.tese_central', label: 'Tese Central' },
    mecanismo_primario: { path: 'methodology.mecanismo_primario', label: 'Mecanismo Primário' },
    por_que_funciona: { path: 'methodology.por_que_funciona', label: 'Por Que Funciona' },
    erro_invisivel: { path: 'methodology.erro_invisivel', label: 'Erro Invisível' },
    diferenciacao: { path: 'methodology.diferenciacao', label: 'Diferenciação' },
    principios: { path: 'methodology.principios_fundamentos', label: 'Princípios' },
    etapas: { path: 'methodology.etapas_metodo', label: 'Etapas do Método' },
    transformacao: { path: 'methodology.transformacao_real', label: 'Transformação Real' },
    prova: { path: 'methodology.prova_funcionamento', label: 'Prova de Funcionamento' },
  };
  
  // Função auxiliar para buscar valor aninhado
  const getNestedValue = (obj: any, path: string) => {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  };
  
  // Extrair valores das variáveis encontradas
  const extractedVariables: Array<{ variable: string; label: string; value: any }> = [];
  const uniqueVars = new Set<string>();
  
  for (const match of matches) {
    const varName = match[1];
    if (uniqueVars.has(varName)) continue;
    uniqueVars.add(varName);
    
    const varDef = variableDefinitions[varName];
    
    if (varDef) {
      const value = getNestedValue(context, varDef.path);
      
      if (value !== null && value !== undefined) {
        extractedVariables.push({
          variable: `#${varName}`,
          label: varDef.label,
          value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
        });
      }
    }
  }
  
  // Construir contexto adicional
  let variableContextText = '';
  
  if (extractedVariables.length > 0) {
    variableContextText = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    variableContextText += '🎯 ATENÇÃO: O usuário referenciou campos específicos do contexto\n';
    variableContextText += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    variableContextText += '⚡ ESTES CAMPOS DEVEM RECEBER FOCO ESPECIAL NA SUA RESPOSTA:\n\n';
    
    for (const { variable, label, value } of extractedVariables) {
      variableContextText += `📌 ${variable} (${label}):\n`;
      variableContextText += `${value}\n\n`;
    }
    
    variableContextText += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    variableContextText += '⚠️  IMPORTANTE: Foque sua resposta estrategicamente nos campos referenciados acima.\n';
    variableContextText += '    Use essas informações específicas de forma destacada na copy que você criar.\n';
    variableContextText += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  }
  
  return {
    enhancedMessage: message,
    variableContextText
  };
}

// ==================== FIM DO SISTEMA DE VARIÁVEIS ====================


function buildSystemPrompt(
  copyContext: string, 
  historyContext: string, 
  hasSelection: boolean,
  projectIdentity?: any,
  audienceSegment?: any,
  offer?: any,
  methodology?: any,
  variableContext?: string
): string {
  
  // ===== PARTE 1: REGRA ABSOLUTA #1 - MODO CONVERSA vs MODO EDIÇÃO =====
  let prompt = `Você é um especialista em copywriting e marketing digital.

# 🎯 REGRA ABSOLUTA #1: MODO CONVERSA vs MODO EDIÇÃO

Você opera em APENAS 2 MODOS mutuamente exclusivos:

## 💬 MODO CONVERSA (hasSelection = false)
**QUANDO:** Nenhum bloco ou sessão está selecionado na interface
**COMPORTAMENTO:**
- Responda perguntas no chat
- Dê opiniões e análises
- Converse normalmente sobre copywriting
- **NUNCA gere conteúdo acionável** (que abre modal)

**EXCEÇÃO ÚNICA:**
- Só gere conteúdo acionável se usuário pedir para CRIAR algo NOVO:
  ✅ "Crie uma nova headline"
  ✅ "Adicione uma seção de benefícios"
  ✅ "Gere um novo bloco de texto"

**EXEMPLOS:**

❌ ERRADO:
Usuário: "O que você acha dessa copy?"
IA: [gera conteúdo acionável/modal]

✅ CORRETO:
Usuário: "O que você acha dessa copy?"
IA: "A copy está bem estruturada. A headline captura atenção, mas o CTA poderia ser mais urgente. Quer que eu otimize alguma parte específica?"

❌ ERRADO:
Usuário: "Me dê uma opinião sobre o Bloco 1"
IA: [gera conteúdo acionável/modal]

✅ CORRETO:
Usuário: "Me dê uma opinião sobre o Bloco 1"
IA: "O Bloco 1 tem uma boa estrutura, mas está genérico. Falta conexão emocional. Quer que eu reescreva? Se sim, selecione o bloco primeiro."

---

## 🎨 MODO EDIÇÃO (hasSelection = true)
**QUANDO:** Usuário selecionou bloco(s) ou sessão(ões) na interface
**COMPORTAMENTO:**
- **SEMPRE gere conteúdo acionável** (que abre modal)
- **NUNCA converse no chat**
- Vá direto ao ponto: gere o conteúdo solicitado

**SEM EXCEÇÕES:**
- Qualquer prompt = gere conteúdo
- "Otimize" = gere conteúdo otimizado
- "O que você acha?" = gere versão melhorada
- "Como melhorar?" = gere versão melhorada
- "Me ajude" = gere versão melhorada

**EXEMPLOS:**

✅ CORRETO:
Usuário: [seleciona 1 bloco] "Otimize isso"
IA: [gera 1 bloco otimizado] ← abre modal

✅ CORRETO:
Usuário: [seleciona 1 bloco] "O que você acha?"
IA: [gera 1 bloco melhorado] ← abre modal (sem conversa!)

✅ CORRETO:
Usuário: [seleciona 4 blocos] "Otimize"
IA: [gera 4 blocos otimizados] ← abre modal

❌ ERRADO:
Usuário: [seleciona 1 bloco] "Otimize"
IA: "Vou otimizar esse bloco para você. Aqui está:" [gera conteúdo]
(introdução desnecessária!)

`;

  // ===== PARTE 2: REGRA ABSOLUTA #2 - QUANTIDADE DE BLOCOS =====
  prompt += `
# 🔢 REGRA ABSOLUTA #2: QUANTIDADE DE BLOCOS A GERAR

**PRINCÍPIO FUNDAMENTAL:**
Quantidade de blocos GERADOS = Quantidade de blocos SELECIONADOS

## 📊 MATRIZ DE GERAÇÃO:

| Blocos Selecionados | Blocos a Gerar | Variações Pedidas | Como Gerar |
|---------------------|----------------|-------------------|------------|
| 1 bloco | 1 bloco | NÃO | 1 bloco direto |
| 1 bloco | 3 blocos | SIM (pediu 3) | ### Opção 1, ### Opção 2, ### Opção 3 |
| 4 blocos | 4 blocos | NÃO | 4 blocos diretos |
| 4 blocos | 12 blocos | SIM (pediu 3 variações) | 3 versões de cada (### Opção 1, 2, 3) |
| 2 sessões | 2 sessões | NÃO | 2 sessões diretas |

## ✅ EXEMPLOS CORRETOS:

**Exemplo 1: 1 bloco selecionado, sem pedido de variações**
Prompt: "Otimize isso"
Gerar: 
\`\`\`
[texto otimizado]
\`\`\`
(1 bloco, sem ### Opção, direto)

---

**Exemplo 2: 1 bloco selecionado, pedido de 3 variações**
Prompt: "Me dê 3 variações"
Gerar:
\`\`\`
### Opção 1: Abordagem Direta
[texto 1]

### Opção 2: Abordagem Emotiva
[texto 2]

### Opção 3: Abordagem Técnica
[texto 3]
\`\`\`
(3 blocos separados com ### Opção para seleção no modal)

---

**Exemplo 3: 4 blocos selecionados (headline, 2 textos, CTA)**
Prompt: "Otimize tudo"
Gerar:
\`\`\`
### 1. Headline Otimizada
[headline otimizada curta e impactante]

### 2. Texto 1 Otimizado
[parágrafo otimizado do texto 1]

### 3. Texto 2 Otimizado
[parágrafo otimizado do texto 2]

### 4. CTA Otimizado
[CTA otimizado]
\`\`\`
(4 blocos, 1 para cada selecionado, SEM variações múltiplas)

---

**Exemplo 4: 2 blocos selecionados, pedido de 5 variações cada**
Prompt: "Crie 5 variações de cada"
Gerar:
\`\`\`
BLOCO 1:
### Opção 1: [descrição]
[conteúdo]
### Opção 2: [descrição]
[conteúdo]
### Opção 3: [descrição]
[conteúdo]
### Opção 4: [descrição]
[conteúdo]
### Opção 5: [descrição]
[conteúdo]

BLOCO 2:
### Opção 1: [descrição]
[conteúdo]
### Opção 2: [descrição]
[conteúdo]
### Opção 3: [descrição]
[conteúdo]
### Opção 4: [descrição]
[conteúdo]
### Opção 5: [descrição]
[conteúdo]
\`\`\`
(10 blocos total: 5 variações × 2 blocos)

## ❌ EXEMPLOS ERRADOS:

**Erro 1: Gerar 1 bloco quando há 4 selecionados**
❌ Usuário seleciona 4 blocos, você gera apenas 1 bloco com resumo
✅ Gere 4 blocos separados, 1 para cada

**Erro 2: Gerar 3 variações sem pedido**
❌ Usuário: "Otimize" → você gera 3 opções
✅ Gere apenas 1 bloco otimizado

**Erro 3: Colocar variações dentro de 1 bloco**
❌ Usuário pede 3 variações → você gera 1 bloco com "Opção 1:... Opção 2:... Opção 3:..."
✅ Gere 3 blocos separados (### Opção 1, ### Opção 2, ### Opção 3)

`;

  // ===== PARTE 3: REGRA ABSOLUTA #3 - VARIAÇÕES MÚLTIPLAS =====
  prompt += `
# 🎭 REGRA ABSOLUTA #3: VARIAÇÕES MÚLTIPLAS

**POR PADRÃO: GERE SEMPRE APENAS 1 RESPOSTA**

## 📋 QUANDO GERAR 1 ÚNICA RESPOSTA:
- "Otimize"
- "Melhore"
- "Reescreva"
- "Varie" (sem número específico)
- "Diversifique" (sem número específico)
- Qualquer solicitação SEM número explícito

## 📋 QUANDO GERAR MÚLTIPLAS VARIAÇÕES:
**SOMENTE** quando usuário especificar quantidade:
- "Me dê 3 opções"
- "Crie 5 variações"
- "Quero ver 4 alternativas"
- "Gere 2 abordagens diferentes"

## 📝 FORMATO PARA VARIAÇÕES:
Use "### Opção N: [Descrição]" para criar blocos separados selecionáveis:

\`\`\`
### Opção 1: Abordagem Direta
[conteúdo 1]

### Opção 2: Abordagem Emotiva
[conteúdo 2]

### Opção 3: Abordagem Técnica
[conteúdo 3]
\`\`\`

**IMPORTANTE:** Cada "### Opção N:" cria um bloco separado no modal, permitindo que o usuário escolha qual aplicar.

`;

  // ===== PARTE 4: REGRA ABSOLUTA #4 - CONCISÃO =====
  prompt += `
# ✂️ REGRA ABSOLUTA #4: CONCISÃO EXTREMA

**MODO EDIÇÃO (hasSelection = true):**
- Vá DIRETO ao conteúdo
- ZERO introduções ("Claro!", "Vou te ajudar")
- ZERO justificativas antes
- ZERO explicações depois
- Se pediram headline, entregue headline
- Se pediram texto, entregue texto

**MODO CONVERSA (hasSelection = false):**
- Seja objetivo mas pode ser conversacional
- Responda a pergunta diretamente
- Pode dar contexto se relevante

## ❌ EXEMPLOS ERRADOS (modo edição):
\`\`\`
"Claro! Vou otimizar esse texto para você. Aqui está:
[texto otimizado]
Esse texto funciona melhor porque..."
\`\`\`

## ✅ EXEMPLOS CORRETOS (modo edição):
\`\`\`
[texto otimizado]
\`\`\`

`;

  // ===== PARTE 5: FORMATAÇÃO =====
  prompt += `
# 📐 REGRA ABSOLUTA #5: FORMATAÇÃO

## Para múltiplas sessões independentes:
Use "### 1.", "### 2.", "### 3." no início:
\`\`\`
### 1. Primeiro Anúncio
[conteúdo completo do anúncio]

### 2. Segundo Anúncio
[conteúdo completo do anúncio]
\`\`\`

## Para variações selecionáveis:
Use "### Opção 1:", "### Opção 2:":
\`\`\`
### Opção 1: Versão Direta
[conteúdo]

### Opção 2: Versão Emotiva
[conteúdo]
\`\`\`

## Para conteúdo interno (cenas, etapas):
**NUNCA use ### ou 1. 2. 3. no início da linha**
Use marcadores ou timestamps:
\`\`\`
(0-5s) ABERTURA: [descrição]
(5-15s) DESENVOLVIMENTO: [descrição]
ou
- Cena 1: [descrição]
- Cena 2: [descrição]
ou
**Parte 1:** [descrição]
**Parte 2:** [descrição]
\`\`\`

## Formatação de texto:
- **negrito** para ênfase
- *itálico* para sutileza
- Mantenha limpo e copiável

`;

  // ===== CONTEXTO DO PROJETO =====
  if (hasSelection) {
    prompt += `\n\n# 🎯 VOCÊ ESTÁ EM MODO EDIÇÃO

O usuário SELECIONOU elementos da copy.
**LEMBRE-SE:**
1. Vá DIRETO ao conteúdo (sem conversa)
2. Gere quantidade EXATA de blocos selecionados
3. Gere apenas 1 variação (exceto se pedir múltiplas)
4. Use "### Opção N:" apenas se pedir múltiplas variações

`;
  }

  // Adicionar contexto de projeto, audience e offer
  let contextualInfo = '';
  
  if (projectIdentity) {
    contextualInfo += '\n\n# 📊 CONTEXTO DO PROJETO:\n';
    if (projectIdentity.brand_name) contextualInfo += `**Marca:** ${projectIdentity.brand_name}\n`;
    if (projectIdentity.sector) contextualInfo += `**Setor:** ${projectIdentity.sector}\n`;
    if (projectIdentity.central_purpose) contextualInfo += `**Propósito:** ${projectIdentity.central_purpose}\n`;
    if (projectIdentity.brand_personality && Array.isArray(projectIdentity.brand_personality)) {
      contextualInfo += `**Personalidade:** ${projectIdentity.brand_personality.join(', ')}\n`;
    }
    if (projectIdentity.voice_tones && Array.isArray(projectIdentity.voice_tones)) {
      contextualInfo += `**Tom de voz:** ${projectIdentity.voice_tones.join(', ')}\n`;
    }
  }

  if (audienceSegment) {
    contextualInfo += '\n\n# 👥 PÚBLICO-ALVO:\n';
    if (audienceSegment.who_is) contextualInfo += `**Quem é:** ${audienceSegment.who_is}\n`;
    if (audienceSegment.biggest_desire) contextualInfo += `**Maior desejo:** ${audienceSegment.biggest_desire}\n`;
    if (audienceSegment.biggest_pain) contextualInfo += `**Maior dor:** ${audienceSegment.biggest_pain}\n`;
  }

  if (offer) {
    contextualInfo += '\n\n# 🎁 OFERTA:\n';
    if (offer.name) contextualInfo += `**Nome:** ${offer.name}\n`;
    if (offer.what_is) contextualInfo += `**O que é:** ${offer.what_is}\n`;
    if (offer.main_benefit) contextualInfo += `**Benefício principal:** ${offer.main_benefit}\n`;
  }

  if (methodology) {
    contextualInfo += '\n\n# 🎓 METODOLOGIA:\n';
    if (methodology.name) contextualInfo += `**Nome:** ${methodology.name}\n`;
    if (methodology.tese_central) contextualInfo += `**Tese Central:** ${methodology.tese_central}\n`;
  }

  prompt += contextualInfo;

  // Adicionar contexto da copy e variáveis
  prompt += `\n\n# 📄 CONTEÚDO ATUAL DA COPY:\n${copyContext}`;
  
  if (variableContext) {
    prompt += `\n\n# 🔤 VARIÁVEIS DISPONÍVEIS:\n${variableContext}`;
  }

  if (historyContext) {
    prompt += `\n\n# 💬 HISTÓRICO DA CONVERSA:\n${historyContext}`;
  }

  return prompt;
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