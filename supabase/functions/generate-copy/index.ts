import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { buildContextualSystemInstruction, getSystemInstructionText } from '../_shared/systemInstructionBuilder.ts';
import { getFullPrompt } from '../_shared/promptHelper.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
  const body = await req.json();
  const { 
    copyType, 
    prompt, 
    copyId,
    workspaceId,
    userId,
    selectedModel,
    systemPrompt // System prompt já gerado pelo generate-system-prompt
  } = body;

  // Determinar modelo: manual (se fornecido) ou automático (baseado em DB ou fallback)
  let modelToUse = selectedModel;

  if (!modelToUse) {
    // Se não for manual, buscar do banco de dados primeiro
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: routingConfig } = await supabaseAdmin
        .from('model_routing_config')
        .select('default_model')
        .eq('copy_type', copyType)
        .single();
      
      if (routingConfig) {
        modelToUse = routingConfig.default_model;
        console.log('Modelo obtido do banco de dados:', modelToUse);
      } else {
        // Fallback para lógica hardcoded
        modelToUse = (copyType === 'vsl' || copyType === 'landing_page' || copyType === 'webinar')
          ? 'openai/gpt-5'
          : 'google/gemini-2.5-flash';
        console.log('Usando fallback hardcoded:', modelToUse);
      }
    } else {
      // Fallback se não tiver credenciais
      modelToUse = (copyType === 'vsl' || copyType === 'landing_page' || copyType === 'webinar')
        ? 'openai/gpt-5'
        : 'google/gemini-2.5-flash';
      console.log('Usando fallback hardcoded (sem credenciais):', modelToUse);
    }
  }

  const wasAutoRouted = selectedModel === null || selectedModel === undefined;

  console.log('=== ROTEAMENTO DE MODELO ===');
  console.log('Copy Type:', copyType);
  console.log('Selected Model (manual):', selectedModel);
  console.log('Modelo que será usado:', modelToUse);
  console.log('Foi auto-routed?', wasAutoRouted);

  if (wasAutoRouted) {
    console.log('Razão do roteamento automático:', 
      copyType === 'vsl' || copyType === 'landing_page' 
        ? 'VSL/LP = Premium (GPT-5 Mini)' 
        : 'Outros = Econômico (Gemini Flash)'
    );
  } else {
    console.log('Razão: Usuário escolheu manualmente o modelo');
  }

    // Verificar créditos antes de gerar (apenas se tiver workspaceId)
    if (workspaceId) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Use model-specific estimated tokens
        const estimatedTokens = modelToUse === 'openai/gpt-5' ? 7000 : 5000;
        
        const { data: creditCheck, error: creditCheckError } = await supabaseAdmin
          .rpc('check_workspace_credits', {
            p_workspace_id: workspaceId,
            estimated_tokens: estimatedTokens,
            p_model_name: modelToUse
          });

        console.log('Credit check result:', creditCheck);

        if (creditCheckError) {
          console.error('Error checking credits:', creditCheckError);
        } else if (creditCheck && !creditCheck.has_sufficient_credits) {
          console.log('Insufficient credits');
          return new Response(
            JSON.stringify({ 
              error: 'insufficient_credits',
              message: 'Créditos insuficientes para gerar copy',
              current_balance: creditCheck.current_balance,
              estimated_debit: creditCheck.estimated_debit
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Usar system prompt fornecido do frontend ou fallback
    let finalSystemPrompt = systemPrompt;

    if (!finalSystemPrompt) {
      console.log('⚠️ System prompt não fornecido, usando fallback');
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const promptKeyMap: Record<string, string> = {
          'anuncio': 'generate_copy_ad',
          'landing_page': 'generate_copy_landing_page',
          'vsl': 'generate_copy_vsl',
          'email': 'generate_copy_email',
          'webinar': 'generate_copy_webinar',
          'conteudo': 'generate_copy_content',
          'mensagem': 'generate_copy_message',
        };
        
        const promptKey = promptKeyMap[copyType] || 'generate_copy_base';
        
        if (userId && workspaceId) {
          finalSystemPrompt = await getFullPrompt(supabaseAdmin, promptKey, userId, workspaceId);
        } else {
          const dynamicPrompt = await getPromptFromDatabase(supabaseAdmin, copyType);
          finalSystemPrompt = dynamicPrompt || buildSystemPrompt(copyType);
        }
      } else {
        finalSystemPrompt = buildSystemPrompt(copyType);
      }
    }
    
    console.log("System prompt length:", finalSystemPrompt.length);
    console.log("Using pre-generated system prompt:", !!systemPrompt);
    
    const userPrompt = prompt;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_copy_structure",
              description: "Gera estrutura de copy com sessões e blocos",
              parameters: {
                type: "object",
                properties: {
                  sessions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        blocks: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              type: {
                                type: "string",
                                enum: ["headline", "subheadline", "text", "list", "button"],
                              },
                              content: {
                                description: "String para texto/headline/subheadline/button, array de strings para listas",
                              },
                              config: {
                                type: "object",
                                description: "Configurações do bloco (fontSize, textAlign, color, etc). SEMPRE inclua config vazio {} mesmo se não tiver configurações específicas.",
                                properties: {
                                  fontSize: { type: "string" },
                                  textAlign: { type: "string" },
                                  color: { type: "string" },
                                  fontWeight: { type: "string" },
                                  listStyle: { type: "string" },
                                  backgroundColor: { type: "string" },
                                  textColor: { type: "string" },
                                  buttonSize: { type: "string" },
                                  link: { type: "string" },
                                },
                              },
                            },
                            required: ["type", "content", "config"],
                          },
                        },
                      },
                      required: ["title", "blocks"],
                    },
                  },
                },
                required: ["sessions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_copy_structure" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da AI Gateway:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "rate_limit_exceeded",
            message: "Limite de requisições excedido. Tente novamente mais tarde." 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "lovable_ai_credits_required",
            message: "Seus créditos do Lovable AI acabaram. Acesse Configurações > Workspace > Uso para adicionar créditos." 
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da IA recebida");

    // Extrair informações de uso (tokens)
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("Nenhum tool call encontrado na resposta");
      throw new Error("Formato de resposta inválido");
    }

    const generatedStructure = JSON.parse(toolCall.function.arguments);

    // Adicionar IDs únicos às sessões e blocos
    const timestamp = Date.now();
    const sessionsWithIds = generatedStructure.sessions.map((session: any, sessionIndex: number) => ({
      ...session,
      id: `ai-session-${timestamp}-${sessionIndex}`,
      blocks: session.blocks.map((block: any, blockIndex: number) => ({
        ...block,
        id: `ai-block-${timestamp}-${sessionIndex}-${blockIndex}`,
      })),
    }));

    console.log(`Copy gerada com sucesso: ${sessionsWithIds.length} sessões`);

    // Salvar no histórico e debitar créditos
    let generationId = null;
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      console.log("=== DEBUG HISTÓRICO ===");
      console.log("SUPABASE_URL:", !!SUPABASE_URL);
      console.log("SUPABASE_SERVICE_ROLE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY);
      console.log("copyId:", copyId);
      console.log("workspaceId:", workspaceId);
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && copyId && workspaceId) {
        console.log("Iniciando salvamento do histórico...");
        
        // Criar client Supabase Admin
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Obter o auth header do request para pegar o usuário autenticado
        const authHeader = req.headers.get('Authorization');
        let userId = null;
        
        if (authHeader) {
          try {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            
            if (error) {
              console.error('Error getting user from token:', error);
            } else {
              userId = user?.id;
              console.log('✓ User ID obtido do token:', userId);
            }
          } catch (e) {
            console.error('Error getting user from token:', e);
          }
        }
        
        if (!userId) {
          console.error('⚠️ Não foi possível obter o userId do token');
        }
        
        // Primeiro, salvar o histórico para obter o ID
        const historyData = {
          copy_id: copyId,
          workspace_id: workspaceId,
          created_by: userId,
          copy_type: copyType,
          prompt,
          system_instruction: null, // System prompt agora salvo na tabela copies
          parameters: {
            usedPreGeneratedSystemPrompt: !!systemPrompt
          },
          project_identity: null,
          audience_segment: null,
          offer: null,
          sessions: sessionsWithIds,
          generation_type: 'create',
          model_used: modelToUse,
          was_auto_routed: wasAutoRouted,
          generation_category: 'text',
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: totalTokens,
        };

        const { data: historyRecord, error: historyError } = await supabaseAdmin
          .from('ai_generation_history')
          .insert(historyData)
          .select('id')
          .single();

        if (historyError) {
          console.error("❌ Erro ao salvar histórico:", historyError);
        } else {
          generationId = historyRecord.id;
          console.log("✓ Histórico salvo com sucesso! ID:", generationId);
          
          // === FASE 2: DÉBITO DE CRÉDITOS COM LOGGING DETALHADO ===
          console.log('\n=== INICIANDO DÉBITO DE CRÉDITOS ===');
          console.log('Generation ID:', generationId);
          console.log('Workspace ID:', workspaceId);
          console.log('Model:', modelToUse);
          console.log('Was Auto Routed:', wasAutoRouted);
          console.log('Total tokens:', totalTokens);
          console.log('Input tokens:', inputTokens);
          console.log('Output tokens:', outputTokens);
          console.log('User ID:', userId);
          
          const { data: debitResult, error: debitError } = await supabaseAdmin
            .rpc('debit_workspace_credits', {
              p_workspace_id: workspaceId,
              p_model_name: modelToUse,
              tokens_used: totalTokens,
              p_input_tokens: inputTokens,
              p_output_tokens: outputTokens,
              generation_id: generationId,
              p_user_id: userId
            });

          console.log('\n=== RESULTADO DO DÉBITO ===');
          console.log('Data:', JSON.stringify(debitResult, null, 2));
          console.log('Error:', JSON.stringify(debitError, null, 2));

          if (debitError) {
            console.error('❌ ERRO AO DEBITAR CRÉDITOS:', debitError);
            console.error('Detalhes do erro:', JSON.stringify(debitError, null, 2));
            // Não falhar a geração, mas logar o erro
          } else if (debitResult && !debitResult.success) {
            console.error('❌ DÉBITO FALHOU:', debitResult.error);
            console.error('Saldo atual:', debitResult.current_balance || 'desconhecido');
            console.error('Valor necessário:', debitResult.required || 'desconhecido');
            // Mesmo se falhar ao debitar, continuar (já foi gerado)
          } else if (debitResult && debitResult.success) {
            console.log('\n✓✓✓ CRÉDITOS DEBITADOS COM SUCESSO ✓✓✓');
            console.log(`  → Debitado: ${debitResult.debited} créditos`);
            console.log(`  → Novo saldo: ${debitResult.balance} créditos`);
            console.log(`  → TPC: ${debitResult.tpc_snapshot}`);
            console.log(`  → Multiplicador: ${debitResult.multiplier_snapshot}`);
            
            // Atualizar o histórico com informações de crédito
            const { error: updateError } = await supabaseAdmin
              .from('ai_generation_history')
              .update({
                credits_debited: debitResult.debited,
                tpc_snapshot: debitResult.tpc_snapshot,
                multiplier_snapshot: debitResult.multiplier_snapshot
              })
              .eq('id', generationId);

            if (updateError) {
              console.error('❌ Erro ao atualizar histórico com créditos:', updateError);
            } else {
              console.log('✓ Histórico atualizado com informações de crédito');
            }
          }
        }
      } else {
        console.log("⚠️ Não foi possível salvar histórico - parâmetros faltando");
      }
    } catch (historyError) {
      console.error("Erro ao salvar no histórico:", historyError);
      // Não falhar a requisição se o histórico falhar
    }

    return new Response(
      JSON.stringify({ 
        sessions: sessionsWithIds,
        modelUsed: modelToUse,
        wasAutoRouted: wasAutoRouted
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao gerar copy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função para buscar prompt do banco de dados
async function getPromptFromDatabase(supabase: any, copyType: string): Promise<string | null> {
  try {
    // Mapear copyType para prompt_key
    const promptKeyMap: Record<string, string> = {
      'anuncio': 'generate_copy_ad',
      'landing_page': 'generate_copy_landing_page',
      'vsl': 'generate_copy_vsl',
      'email': 'generate_copy_email',
      'webinar': 'generate_copy_webinar',
      'conteudo': 'generate_copy_content',
      'mensagem': 'generate_copy_message',
      'outro': 'generate_copy_base'
    };
    
    const promptKey = promptKeyMap[copyType] || 'generate_copy_base';
    
    // Buscar base prompt primeiro
    const { data: basePromptData } = await supabase
      .from('ai_prompt_templates')
      .select('current_prompt')
      .eq('prompt_key', 'generate_copy_base')
      .eq('is_active', true)
      .single();
    
    const basePrompt = basePromptData?.current_prompt || '';
    
    // Se for o tipo base, retornar apenas ele
    if (promptKey === 'generate_copy_base') {
      return basePrompt || null;
    }
    
    // Buscar prompt específico do tipo
    const { data: specificPromptData } = await supabase
      .from('ai_prompt_templates')
      .select('current_prompt')
      .eq('prompt_key', promptKey)
      .eq('is_active', true)
      .single();
    
    if (specificPromptData?.current_prompt) {
      // Combinar base + específico se existir
      return basePrompt 
        ? `${basePrompt}\n\n${specificPromptData.current_prompt}`
        : specificPromptData.current_prompt;
    }
    
    // Se não encontrou prompt específico mas tem base, retornar base
    return basePrompt || null;
    
  } catch (error) {
    console.error('Erro ao buscar prompt do banco:', error);
    return null;
  }
}

function buildSystemPrompt(copyType: string): string {
  const basePrompt = `Você é um especialista em copywriting que cria conteúdo persuasivo e bem estruturado em português brasileiro.

IMPORTANTE: Você tem acesso a diferentes tipos de blocos (headline, subheadline, text, list, button), mas deve usar APENAS os que fazem sentido para o contexto específico da copy. Não force o uso de todos os tipos de blocos se eles não agregarem valor ao conteúdo.

DIRETRIZES DE USO DE BLOCOS:
- headline: Use para títulos principais impactantes e chamadas de atenção (obrigatório na maioria das copies)
- subheadline: Use APENAS quando o headline precisar de complementação ou expansão do conceito
- text: Use para desenvolvimento de ideias, explicações, storytelling e argumentação
- list: Use SEMPRE que o usuário fornecer uma lista explícita no prompt (usando -, •, números, etc.) ou quando houver benefícios, features, passos ou pontos que precisem ser listados
- button: Use APENAS quando houver uma ação clara e específica que você quer que o usuário tome

REGRA CRÍTICA SOBRE LISTAS:
- Se o prompt do usuário contém uma lista formatada (com -, •, 1., 2., etc.), você DEVE converter para um bloco "list"
- Exemplo: Se o usuário escreve "- Benefício 1\n- Benefício 2\n- Benefício 3", crie um bloco list com array ["Benefício 1", "Benefício 2", "Benefício 3"]
- NUNCA ignore listas explícitas fornecidas pelo usuário

QUANDO NÃO USAR:
- Não use subheadline se o headline for auto-explicativo
- Não use button em conteúdos informativos ou educativos que não exigem ação imediata
- Não crie listas genéricas se o usuário não forneceu uma`;

  const typeSpecificPrompts: Record<string, string> = {
    anuncio: `${basePrompt}

Especializado em anúncios diretos e impactantes. Para anúncios:
- Priorize headline + text curto + button (estrutura mínima e direta)
- Use list apenas se os benefícios forem o foco principal
- Mantenha conciso e direto ao ponto`,
    
    landing_page: `${basePrompt}

Especializado em landing pages que convertem. Para landing pages:
- Use headline obrigatoriamente
- Subheadline útil para expandir a proposta de valor
- Lists são importantes para benefícios, features e prova social
- Button é essencial para conversão
- Text para desenvolver argumentação e superar objeções`,
    
    vsl: `${basePrompt}

Especializado em Video Sales Letters com storytelling envolvente. Para VSL:
- Priorize text para contar a história e criar conexão
- Headline para gancho inicial forte
- Use list apenas para resumir pontos-chave ou benefícios finais
- Button no final para a oferta`,
    
    email: `${basePrompt}

Especializado em emails de conversão. Para emails:
- Headline como assunto/abertura impactante
- Text para corpo do email (mantenha escaneável)
- List opcional para benefícios ou pontos-chave
- Button para CTA claro
- Evite muitos blocos - emails devem ser diretos`,
    
    webinar: `${basePrompt}

Especializado em conteúdo para webinars. Para webinars:
- Headline para título da sessão
- Text para introdução e desenvolvimento de tópicos
- List para agenda, takeaways ou pontos-chave
- Button para registro ou próximos passos`,
    
    conteudo: `${basePrompt}

Especializado em conteúdo de valor educativo. Para conteúdo:
- Foco em text para desenvolvimento profundo
- Headline para títulos de seções
- List quando houver passos, dicas ou conceitos múltiplos
- Button apenas se houver CTA relevante (download, próxima leitura, etc.)
- Evite buttons forçados em conteúdo puramente educativo`,
    
    mensagem: `${basePrompt}

Especializado em mensagens diretas para WhatsApp/Telegram. Para mensagens:
- MINIMALISTA: use o mínimo de blocos possível
- Priorize text para manter conversacional
- Headline apenas se realmente necessário para impacto
- Evite lists em mensagens - quebre em múltiplas mensagens se necessário
- Button apenas se houver link/ação específica`,
    
    outro: basePrompt,
  };

  return typeSpecificPrompts[copyType] || basePrompt;
}

function buildUserPrompt(params: any): string {
  const { framework, objective, styles, emotionalFocus, prompt, projectIdentity, audienceSegment, offer } = params;

  const frameworkText = framework || "não especificado";
  const objectiveText = objective || "não especificado";
  const stylesText = styles && styles.length > 0 ? styles.join(", ") : "não especificado";
  const emotionalFocusText = emotionalFocus || "não especificado";

  let projectContext = "";
  if (projectIdentity) {
    projectContext = `
**IDENTIDADE DO PROJETO:**
- Nome da Marca: ${projectIdentity.brand_name || "não especificado"}
- Setor: ${projectIdentity.sector || "não especificado"}
- Propósito Central: ${projectIdentity.central_purpose || "não especificado"}
- Personalidade da Marca: ${projectIdentity.brand_personality?.join(", ") || "não especificado"}
- Palavras-chave: ${projectIdentity.keywords?.join(", ") || "não especificado"}
`;
  }

  let audienceContext = "";
  if (audienceSegment) {
    audienceContext = `
**PÚBLICO-ALVO:**

=== PERFIL BÁSICO (Preenchimento Manual) ===
- Quem é: ${audienceSegment.who_is || "não especificado"}
- Maior desejo: ${audienceSegment.biggest_desire || "não especificado"}
- Maior dor: ${audienceSegment.biggest_pain || "não especificado"}
- Tentativas que falharam: ${audienceSegment.failed_attempts || "não especificado"}
- Crenças: ${audienceSegment.beliefs || "não especificado"}
- Comportamento: ${audienceSegment.behavior || "não especificado"}
- Jornada: ${audienceSegment.journey || "não especificado"}
`;

    // Se tiver análise avançada, adicionar
    if (audienceSegment.advanced_analysis) {
      const aa = audienceSegment.advanced_analysis;
      audienceContext += `
=== ANÁLISE AVANÇADA (Perfil Psicográfico Profundo) ===
${aa.consciousness_level ? `\nNível de Consciência:\n${aa.consciousness_level}` : ''}
${aa.psychographic_profile ? `\nPerfil Psicográfico:\n${aa.psychographic_profile}` : ''}
${aa.pains_frustrations ? `\nDores e Frustrações:\n${aa.pains_frustrations}` : ''}
${aa.desires_aspirations ? `\nDesejos e Aspirações:\n${aa.desires_aspirations}` : ''}
${aa.behaviors_habits ? `\nComportamentos e Hábitos:\n${aa.behaviors_habits}` : ''}
${aa.language_communication ? `\nLinguagem e Comunicação:\n${aa.language_communication}` : ''}
${aa.influences_references ? `\nInfluências e Referências:\n${aa.influences_references}` : ''}
${aa.internal_barriers ? `\nBarreiras Internas:\n${aa.internal_barriers}` : ''}
${aa.anti_persona ? `\nAnti-Persona:\n${aa.anti_persona}` : ''}
`;
    }
  }

  let offerContext = "";
  if (offer) {
    offerContext = `
**OFERTA:**
- Nome: ${offer.name}
- Tipo: ${offer.type}
- Descrição: ${offer.short_description}
- Benefício Principal: ${offer.main_benefit}
- Mecanismo Único: ${offer.unique_mechanism}
- Diferenciais: ${offer.differentials?.join(", ") || "não especificado"}
- Prova: ${offer.proof}
- Garantia: ${offer.guarantee || "não especificado"}
- CTA: ${offer.cta}
`;
  }

  return `
Crie uma copy em português brasileiro com as seguintes características:
${projectContext}${audienceContext}${offerContext}
**PARÂMETROS DA COPY:**
- Estrutura: ${frameworkText}
- Objetivo: ${objectiveText}
- Estilo de Escrita: ${stylesText}
- Foco Emocional: ${emotionalFocusText}

**DETALHES DA COPY:**
${prompt}

INSTRUÇÕES IMPORTANTES:
- **SELEÇÃO INTELIGENTE DE BLOCOS**: Analise o tipo de copy, objetivo e contexto para escolher APENAS os blocos necessários
- Use "headline" para títulos principais (texto curto e impactante)
- Use "subheadline" SOMENTE se o headline precisar de complementação importante
- Use "text" para parágrafos de desenvolvimento (pode ter vários parágrafos)
- Use "list" SEMPRE que o prompt contiver listas formatadas (-, •, 1., etc.) e o content DEVE ser array de strings
- Use "button" SOMENTE quando houver uma ação clara e específica (incluir link no config.link)
- Cada sessão deve ter um título descritivo e APENAS os blocos relevantes
- NÃO force o uso de todos os tipos de blocos - qualidade > quantidade
- O conteúdo deve ser persuasivo, claro e orientado para ação quando apropriado
- Adapte o tom, estrutura e blocos de acordo com o tipo de copy e preferências fornecidas

IMPORTANTE SOBRE USO DO CONTEXTO DO PROJETO:
- Para seções de PROVA/AUTORIDADE/CREDIBILIDADE/DIFERENCIAL:
  * Use os dados de "Prova" (${offer?.proof || 'não fornecido'}) se disponível
  * Use os "Diferenciais" (${offer?.differentials?.join(', ') || 'não fornecido'}) se disponível
  * Incorpore informações de "Garantia" (${offer?.guarantee || 'não fornecido'}) se relevante
  * Use "Mecanismo Único" (${offer?.unique_mechanism || 'não fornecido'}) para mostrar diferenciais
- Para seções sobre RESULTADOS/TRANSFORMAÇÃO/BENEFÍCIOS:
  * Use "Resultado Desejado" (${audienceSegment?.desired_result || 'não fornecido'}) do público-alvo
  * Use "Benefício Principal" (${offer?.main_benefit || 'não fornecido'}) da oferta
  * Conecte com a "Situação Atual" (${audienceSegment?.current_situation || 'não fornecido'}) do público
- SEMPRE que o prompt mencionar essas seções, preencha com os dados fornecidos no contexto do projeto

EXEMPLOS DE USO CORRETO:
- Anúncio simples: headline + text + button (3 blocos)
- Mensagem WhatsApp: text apenas (1 bloco)
- Email curto: headline + text + button (3 blocos)
- Landing page: headline + subheadline + text + list + button (5+ blocos)

FORMATO DE CONFIG:
- fontSize: "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"
- textAlign: "left", "center", "right", "justify"
- color: cores em formato de token do design system
- fontWeight: "font-normal", "font-medium", "font-semibold", "font-bold"
- listStyle: "bullets" ou "numbers"
- buttonSize: "sm", "md", "lg"
`;
}
