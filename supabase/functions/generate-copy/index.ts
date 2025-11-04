import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { copyType, objetivos, estilos, tamanhos, preferencias, prompt, projectIdentity, audienceSegment, offer } = await req.json();

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
  const basePrompt = `Você é um especialista em copywriting que cria conteúdo persuasivo e bem estruturado em português brasileiro.`;

  const typeSpecificPrompts: Record<string, string> = {
    anuncio: `${basePrompt} Especializado em anúncios diretos e impactantes que capturam atenção rapidamente.`,
    landing_page: `${basePrompt} Especializado em landing pages que convertem, com estrutura clara de benefícios, prova social e CTAs.`,
    vsl: `${basePrompt} Especializado em Video Sales Letters com storytelling envolvente e estrutura AIDA.`,
    email: `${basePrompt} Especializado em emails de conversão com assuntos cativantes e copy escaneável.`,
    webinar: `${basePrompt} Especializado em conteúdo para webinars com estrutura educativa e engajadora.`,
    conteudo: `${basePrompt} Especializado em conteúdo de valor que educa e constrói autoridade.`,
    mensagem: `${basePrompt} Especializado em mensagens diretas e conversacionais para WhatsApp/Telegram.`,
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
- Estruture a copy em sessões e blocos apropriados
- Use "headline" para títulos principais (texto curto e impactante)
- Use "subheadline" para subtítulos (complementam o headline)
- Use "text" para parágrafos de texto (pode ter vários parágrafos)
- Use "list" para listas com bullets ou números (content DEVE ser array de strings)
- Use "button" para CTAs (incluir link no config.link)
- Cada sessão deve ter um título descritivo e blocos relevantes
- O conteúdo deve ser persuasivo, claro e orientado para ação
- Adapte o tom e estrutura de acordo com as preferências fornecidas

FORMATO DE CONFIG:
- fontSize: "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl"
- textAlign: "left", "center", "right", "justify"
- color: cores em formato de token do design system
- fontWeight: "font-normal", "font-medium", "font-semibold", "font-bold"
- listStyle: "bullets" ou "numbers"
- buttonSize: "sm", "md", "lg"
`;
}
