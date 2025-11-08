import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  action: 'otimizar' | 'variacao';
  originalContent: any[];
  instructions: string;
  projectIdentity?: any;
  audienceSegment?: any;
  offer?: any;
  regenerateInstructions?: string;
  copyId: string;
  workspaceId: string;
}

function buildSystemPrompt(action: 'otimizar' | 'variacao'): string {
  const basePrompt = `Você é um especialista em copywriting e marketing digital.`;
  
  if (action === 'otimizar') {
    return `${basePrompt}

Sua tarefa é OTIMIZAR o conteúdo fornecido, mantendo a estrutura similar mas melhorando:
- Clareza e impacto da mensagem
- Persuasão e engajamento
- Qualidade da escrita
- Flow e coerência

REGRAS DE OTIMIZAÇÃO:
1. Mantenha a mesma quantidade aproximada de blocos
2. Mantenha os tipos de blocos similares (se tem headline, mantenha headline)
3. Preserve a estrutura geral e ordem lógica
4. Foque em melhorar o conteúdo, não em mudar radicalmente
5. Mantenha o tom e voz, apenas refine

SELEÇÃO INTELIGENTE DE BLOCOS:
- Use apenas os tipos de blocos adequados ao contexto
- headline: Use para títulos principais impactantes
- subheadline: Use para complementar headlines, adicionar contexto
- text: Use para parágrafos explicativos e corpo do texto
- list: Use para enumerar benefícios, features, etapas (IMPORTANTE: content deve ser array de strings)
- button: Use para CTAs claros (IMPORTANTE: config.link é obrigatório)`;
  } else {
    return `${basePrompt}

Sua tarefa é CRIAR UMA VARIAÇÃO do conteúdo fornecido:
- Pode alterar abordagem e estrutura livremente
- Pode mudar tipos e quantidade de blocos
- Mantenha a mensagem central e objetivo
- Explore diferentes ângulos e formatos
- Seja criativo e traga uma perspectiva nova

REGRAS DE VARIAÇÃO:
1. Mantenha o objetivo final do conteúdo
2. Pode reorganizar completamente a estrutura
3. Pode usar mais ou menos blocos conforme necessário
4. Explore ângulos diferentes (emocional vs racional, urgência vs benefício, etc)
5. Mantenha alta qualidade e persuasão

SELEÇÃO INTELIGENTE DE BLOCOS:
- Use apenas os tipos de blocos adequados ao contexto
- headline: Use para títulos principais impactantes
- subheadline: Use para complementar headlines, adicionar contexto
- text: Use para parágrafos explicativos e corpo do texto
- list: Use para enumerar benefícios, features, etapas (IMPORTANTE: content deve ser array de strings)
- button: Use para CTAs claros (IMPORTANTE: config.link é obrigatório)`;
  }
}

function buildUserPrompt(
  action: 'otimizar' | 'variacao',
  originalContent: any[],
  instructions: string,
  projectIdentity?: any,
  audienceSegment?: any,
  offer?: any,
  regenerateInstructions?: string
): string {
  let prompt = ``;

  // Adicionar contexto do projeto se disponível
  if (projectIdentity) {
    prompt += `IDENTIDADE DA MARCA:\n`;
    if (projectIdentity.brand_name) prompt += `- Nome: ${projectIdentity.brand_name}\n`;
    if (projectIdentity.sector) prompt += `- Setor: ${projectIdentity.sector}\n`;
    if (projectIdentity.central_purpose) prompt += `- Propósito Central: ${projectIdentity.central_purpose}\n`;
    if (projectIdentity.brand_personality?.length) prompt += `- Personalidade da Marca: ${projectIdentity.brand_personality.join(', ')}\n`;
    if (projectIdentity.keywords?.length) prompt += `- Palavras-chave: ${projectIdentity.keywords.join(', ')}\n`;
    prompt += `\n`;
  }

  if (audienceSegment) {
    prompt += `PÚBLICO-ALVO:\n`;
    prompt += `\n=== PERFIL BÁSICO (Preenchimento Manual) ===\n`;
    
    if (audienceSegment.who_is) 
      prompt += `Quem é: ${audienceSegment.who_is}\n`;
    if (audienceSegment.biggest_desire) 
      prompt += `Maior desejo: ${audienceSegment.biggest_desire}\n`;
    if (audienceSegment.biggest_pain) 
      prompt += `Maior dor: ${audienceSegment.biggest_pain}\n`;
    if (audienceSegment.failed_attempts) 
      prompt += `Tentativas que falharam: ${audienceSegment.failed_attempts}\n`;
    if (audienceSegment.beliefs) 
      prompt += `Crenças: ${audienceSegment.beliefs}\n`;
    if (audienceSegment.behavior) 
      prompt += `Comportamento: ${audienceSegment.behavior}\n`;
    if (audienceSegment.journey) 
      prompt += `Jornada: ${audienceSegment.journey}\n`;

    // Se tiver análise avançada, adicionar
    if (audienceSegment.advanced_analysis) {
      prompt += `\n=== ANÁLISE AVANÇADA (Perfil Psicográfico Profundo) ===\n`;
      const aa = audienceSegment.advanced_analysis;
      
      if (aa.consciousness_level) 
        prompt += `\nNível de Consciência:\n${aa.consciousness_level}\n`;
      if (aa.psychographic_profile) 
        prompt += `\nPerfil Psicográfico:\n${aa.psychographic_profile}\n`;
      if (aa.pains_frustrations) 
        prompt += `\nDores e Frustrações:\n${aa.pains_frustrations}\n`;
      if (aa.desires_aspirations) 
        prompt += `\nDesejos e Aspirações:\n${aa.desires_aspirations}\n`;
      if (aa.behaviors_habits) 
        prompt += `\nComportamentos e Hábitos:\n${aa.behaviors_habits}\n`;
      if (aa.language_communication) 
        prompt += `\nLinguagem e Comunicação:\n${aa.language_communication}\n`;
      if (aa.influences_references) 
        prompt += `\nInfluências e Referências:\n${aa.influences_references}\n`;
      if (aa.internal_barriers) 
        prompt += `\nBarreiras Internas:\n${aa.internal_barriers}\n`;
      if (aa.anti_persona) 
        prompt += `\nAnti-Persona:\n${aa.anti_persona}\n`;
    }
    
    prompt += `\n`;
  }

  if (offer) {
    prompt += `OFERTA:\n`;
    if (offer.name) prompt += `- Nome: ${offer.name}\n`;
    if (offer.description) prompt += `- Descrição: ${offer.description}\n`;
    if (offer.key_benefits?.length) prompt += `- Benefícios: ${offer.key_benefits.join(', ')}\n`;
    if (offer.price) prompt += `- Preço: ${offer.price}\n`;
    prompt += `\n`;
  }

  prompt += `CONTEÚDO ORIGINAL:\n`;
  originalContent.forEach((session, idx) => {
    prompt += `\nSessão ${idx + 1}: ${session.title}\n`;
    session.blocks.forEach((block: any, blockIdx: number) => {
      const content = Array.isArray(block.content) 
        ? block.content.join('\n  - ') 
        : block.content;
      prompt += `  Bloco ${blockIdx + 1} [${block.type}]: ${content}\n`;
    });
  });

  prompt += `\nINSTRUÇÕES DO USUÁRIO:\n${instructions}\n`;

  if (regenerateInstructions) {
    prompt += `\nINSTRUÇÕES EXTRAS PARA REGENERAÇÃO:\n${regenerateInstructions}\n`;
  }

  if (action === 'otimizar') {
    prompt += `\nMantenha a mesma quantidade de blocos e tipos. Apenas melhore o conteúdo mantendo a estrutura.`;
  } else {
    prompt += `\nCrie uma versão alternativa completa. Pode alterar estrutura e abordagem.`;
  }

  prompt += `\n\nINSTRUÇÕES IMPORTANTES:
1. Retorne o conteúdo usando a ferramenta generate_copy
2. Mantenha alta qualidade e persuasão
3. Para listas (type: list), content DEVE ser um array de strings
4. Para botões (type: button), config.link é OBRIGATÓRIO
5. Use apenas blocos que fazem sentido para o contexto`;

  return prompt;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: OptimizeRequest = await req.json();
    const {
      action,
      originalContent,
      instructions,
      projectIdentity,
      audienceSegment,
      offer,
      regenerateInstructions,
      copyId,
      workspaceId
    } = body;

    console.log(`Optimizing copy with action: ${action}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = buildSystemPrompt(action);
    const userPrompt = buildUserPrompt(
      action,
      originalContent,
      instructions,
      projectIdentity,
      audienceSegment,
      offer,
      regenerateInstructions
    );

    const toolDefinition = {
      type: "function",
      function: {
        name: "generate_copy",
        description: "Gera ou otimiza conteúdo de copy estruturado em sessões e blocos",
        parameters: {
          type: "object",
          properties: {
            sessions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título da sessão" },
                  blocks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["headline", "subheadline", "text", "list", "button"],
                          description: "Tipo do bloco"
                        },
                        content: {
                          description: "Conteúdo - string para text/headline/subheadline/button, array para list",
                          oneOf: [
                            { type: "string" },
                            { type: "array", items: { type: "string" } }
                          ]
                        },
                        config: {
                          type: "object",
                          description: "Configurações do bloco (fontSize, textAlign, color, etc). SEMPRE inclua config vazio {} mesmo se não tiver configurações específicas.",
                          properties: {
                            fontSize: { type: "string" },
                            textAlign: { type: "string" },
                            color: { type: "string" },
                            backgroundColor: { type: "string" },
                            textColor: { type: "string" },
                            buttonSize: { type: "string" },
                            link: { type: "string" }
                          }
                        }
                      },
                      required: ["type", "content", "config"]
                    }
                  }
                },
                required: ["title", "blocks"]
              }
            }
          },
          required: ["sessions"]
        }
      }
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "generate_copy" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'rate_limit', message: 'Limite de requisições atingido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'insufficient_credits', message: 'Créditos insuficientes. Adicione mais créditos para continuar.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extrair informações de uso (tokens)
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    // Adicionar IDs únicos às sessões e blocos
    const timestamp = Date.now();
    const sessionsWithIds = generatedContent.sessions.map((session: any, sessionIndex: number) => ({
      ...session,
      id: `optimize-session-${timestamp}-${sessionIndex}`,
      blocks: session.blocks.map((block: any, blockIndex: number) => ({
        ...block,
        id: `optimize-block-${timestamp}-${sessionIndex}-${blockIndex}`,
        config: block.config || {},
      })),
    }));

    // Salvar no histórico
    const { error: historyError } = await supabase
      .from('ai_generation_history')
      .insert({
        copy_id: copyId,
        workspace_id: workspaceId,
        created_by: user.id,
        generation_type: action === 'otimizar' ? 'optimize' : 'variation',
        copy_type: 'outro',
        prompt: instructions,
        parameters: {
          action,
          regenerateInstructions,
          hasProjectIdentity: !!projectIdentity,
          hasAudienceSegment: !!audienceSegment,
          hasOffer: !!offer
        },
        original_content: originalContent,
        sessions: sessionsWithIds,
        project_identity: projectIdentity || null,
        audience_segment: audienceSegment || null,
        offer: offer || null,
        model_used: 'google/gemini-2.5-flash',
        generation_category: 'text',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
      });

    if (historyError) {
      console.error('Error saving to history:', historyError);
    }

    return new Response(
      JSON.stringify({ sessions: sessionsWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in optimize-copy function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
