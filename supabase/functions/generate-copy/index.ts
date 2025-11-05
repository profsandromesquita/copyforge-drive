import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      objectives, 
      styles, 
      size, 
      preferences, 
      prompt, 
      projectIdentity, 
      audienceSegment, 
      offer,
      copyId,
      workspaceId 
    } = body;

    // Mapear parâmetros do inglês para português e garantir que sejam arrays
    const objetivos = Array.isArray(objectives) ? objectives : [];
    const estilos = Array.isArray(styles) ? styles : [];
    const tamanhos = size ? [size] : [];
    const preferencias = Array.isArray(preferences) ? preferences : [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY não configurada");
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("Gerando copy com parâmetros:", { copyType, objetivos, estilos, tamanhos, preferencias });

    const systemPrompt = buildSystemPrompt(copyType);
    const userPrompt = buildUserPrompt({ objetivos, estilos, tamanhos, preferencias, prompt, projectIdentity, audienceSegment, offer });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
          JSON.stringify({ error: "Limite de uso excedido. Tente novamente mais tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Resposta da IA recebida");

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

    // Salvar no histórico
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && copyId && workspaceId) {
        const historyData = {
          copy_id: copyId,
          workspace_id: workspaceId,
          copy_type: copyType,
          prompt,
          parameters: {
            objectives: objetivos,
            styles: estilos,
            size: tamanhos[0] || '',
            preferences: preferencias,
            hasProjectIdentity: !!projectIdentity,
            hasAudienceSegment: !!audienceSegment,
            hasOffer: !!offer,
          },
          project_identity: projectIdentity || null,
          audience_segment: audienceSegment || null,
          offer: offer || null,
          sessions: sessionsWithIds,
          generation_type: 'create',
        };

        const historyResponse = await fetch(`${SUPABASE_URL}/rest/v1/ai_generation_history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify(historyData),
        });

        if (!historyResponse.ok) {
          console.error("Erro ao salvar histórico:", await historyResponse.text());
        } else {
          console.log("Histórico salvo com sucesso");
        }
      }
    } catch (historyError) {
      console.error("Erro ao salvar no histórico:", historyError);
      // Não falhar a requisição se o histórico falhar
    }

    return new Response(
      JSON.stringify({ sessions: sessionsWithIds }),
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

function buildSystemPrompt(copyType: string): string {
  const basePrompt = `Você é um especialista em copywriting que cria conteúdo persuasivo e bem estruturado em português brasileiro.

IMPORTANTE: Você tem acesso a diferentes tipos de blocos (headline, subheadline, text, list, button), mas deve usar APENAS os que fazem sentido para o contexto específico da copy. Não force o uso de todos os tipos de blocos se eles não agregarem valor ao conteúdo.

DIRETRIZES DE USO DE BLOCOS:
- headline: Use para títulos principais impactantes e chamadas de atenção (obrigatório na maioria das copies)
- subheadline: Use APENAS quando o headline precisar de complementação ou expansão do conceito
- text: Use para desenvolvimento de ideias, explicações, storytelling e argumentação
- list: Use APENAS quando houver benefícios, features, passos ou pontos que realmente precisem ser listados
- button: Use APENAS quando houver uma ação clara e específica que você quer que o usuário tome

QUANDO NÃO USAR:
- Não use subheadline se o headline for auto-explicativo
- Não use list se o conteúdo fluir melhor em texto corrido
- Não use button em conteúdos informativos ou educativos que não exigem ação imediata
- Não crie listas genéricas ou desnecessárias apenas para preencher blocos`;

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
  const { objetivos, estilos, tamanhos, preferencias, prompt, projectIdentity, audienceSegment, offer } = params;

  const objetivosText = objetivos.length > 0 ? objetivos.join(", ") : "não especificado";
  const estilosText = estilos.length > 0 ? estilos.join(", ") : "não especificado";
  const tamanhosText = tamanhos.length > 0 ? tamanhos.join(", ") : "não especificado";
  const preferenciasText = preferencias.length > 0 ? preferencias.join(", ") : "não especificado";

  let projectContext = "";
  if (projectIdentity) {
    projectContext = `
**IDENTIDADE DO PROJETO:**
- Nome da Marca: ${projectIdentity.brand_name || "não especificado"}
- Setor: ${projectIdentity.sector || "não especificado"}
- Propósito Central: ${projectIdentity.central_purpose || "não especificado"}
- Tons de Voz: ${projectIdentity.voice_tones?.join(", ") || "não especificado"}
- Personalidade da Marca: ${projectIdentity.brand_personality?.join(", ") || "não especificado"}
- Palavras-chave: ${projectIdentity.keywords?.join(", ") || "não especificado"}
`;
  }

  let audienceContext = "";
  if (audienceSegment) {
    audienceContext = `
**PÚBLICO-ALVO:**
- Nome: ${audienceSegment.name}
- Avatar: ${audienceSegment.avatar}
- Segmento: ${audienceSegment.segment}
- Situação Atual: ${audienceSegment.current_situation}
- Resultado Desejado: ${audienceSegment.desired_result}
- Nível de Consciência: ${audienceSegment.awareness_level}
- Objeções: ${audienceSegment.objections?.join(", ") || "não especificado"}
- Tom de Comunicação: ${audienceSegment.communication_tone}
`;
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
- Objetivos: ${objetivosText}
- Estilo de Escrita: ${estilosText}
- Tamanho: ${tamanhosText}
- Preferências: ${preferenciasText}

**DETALHES DA COPY:**
${prompt}

INSTRUÇÕES IMPORTANTES:
- **SELEÇÃO INTELIGENTE DE BLOCOS**: Analise o tipo de copy, objetivo e contexto para escolher APENAS os blocos necessários
- Use "headline" para títulos principais (texto curto e impactante)
- Use "subheadline" SOMENTE se o headline precisar de complementação importante
- Use "text" para parágrafos de desenvolvimento (pode ter vários parágrafos)
- Use "list" SOMENTE quando houver itens que realmente precisem ser listados (content DEVE ser array de strings)
- Use "button" SOMENTE quando houver uma ação clara e específica (incluir link no config.link)
- Cada sessão deve ter um título descritivo e APENAS os blocos relevantes
- NÃO force o uso de todos os tipos de blocos - qualidade > quantidade
- O conteúdo deve ser persuasivo, claro e orientado para ação quando apropriado
- Adapte o tom, estrutura e blocos de acordo com o tipo de copy e preferências fornecidas

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
