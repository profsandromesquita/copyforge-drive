import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração de validação por campo
const FIELD_MIN_LENGTHS: Record<string, number> = {
  psychographic_profile: 150,
  consciousness_level: 150,
  emotional_state: 150,
  hidden_pain: 150,
  primary_fear: 150,
  emotional_desire: 150,
  problem_misperception: 150,
  internal_mechanism: 150,
  limiting_belief: 150,
  internal_narrative: 150,
  internal_contradiction: 150,
  dominant_behavior: 150,
  decision_trigger: 150,
  communication_style: 150,
  psychological_resistances: 150,
};

// Lista de campos obrigatórios de texto
const TEXT_REQUIRED_FIELDS = Object.keys(FIELD_MIN_LENGTHS);

// Função para validar campos
function validateAnalysis(analysis: any): { isValid: boolean; incompleteFields: string[]; fieldSizes: Record<string, number> } {
  const incompleteFields: string[] = [];
  const fieldSizes: Record<string, number> = {};
  
  for (const field of TEXT_REQUIRED_FIELDS) {
    const value = analysis[field];
    const size = typeof value === 'string' ? value.length : 0;
    fieldSizes[field] = size;
    
    const minLength = FIELD_MIN_LENGTHS[field];
    if (!value || typeof value !== 'string' || size < minLength) {
      incompleteFields.push(field);
    }
  }
  
  return {
    isValid: incompleteFields.length === 0,
    incompleteFields,
    fieldSizes,
  };
}

// Função para gerar schema de repair (apenas campos incompletos)
function buildRepairSchema(incompleteFields: string[]) {
  const properties: Record<string, any> = {};
  
  const fieldDescriptions: Record<string, string> = {
    psychographic_profile: "Perfil psicográfico completo: valores centrais, estilo de vida, traços de personalidade, identidade social, autoimagem. Mínimo 150 caracteres, 3-5 frases completas.",
    consciousness_level: "Nível de consciência do problema/solução (Eugene Schwartz). Descreva o estágio, por quê está nesse nível, barreiras mentais. Mínimo 150 caracteres.",
    emotional_state: "Estado emocional predominante: emoções dominantes, intensidade, gatilhos, padrões de oscilação. Mínimo 150 caracteres.",
    hidden_pain: "A dor real não verbalizada: sofrimento subjacente, o que mantém acordado à noite, dor por vergonha/medo. Mínimo 150 caracteres.",
    primary_fear: "Medo fundamental que dirige comportamentos: medo profundo, manifestação diária, consequências que evita. Mínimo 150 caracteres.",
    emotional_desire: "Estado emocional desejado: como quer se sentir, como quer ser visto, emoções de transformação esperadas. Mínimo 150 caracteres.",
    problem_misperception: "O que ACHA que é o problema (mas está errado): diagnóstico equivocado, culpa incorreta, gap percebido vs real. Mínimo 150 caracteres.",
    internal_mechanism: "Como o problema funciona internamente (ciclo vicioso): loop comportamental, Gatilho→Comportamento→Consequência→Reforço. Mínimo 150 caracteres.",
    limiting_belief: "Crença central que sabota progresso: crença limitante principal, origem, manifestação em decisões. Mínimo 150 caracteres.",
    internal_narrative: "História que conta para si mesmo: narrativa predominante, papel que se atribui, justificativas, script mental. Mínimo 150 caracteres.",
    internal_contradiction: "Conflitos internos entre desejos e ações: 'Quero X mas faço Y', valores conflitantes, ambivalência. Mínimo 150 caracteres.",
    dominant_behavior: "Padrão de ação mais frequente relacionado ao problema: comportamento automático, situações gatilho, função, resultado. Mínimo 150 caracteres, 3-5 frases.",
    decision_trigger: "O que faz finalmente tomar ação: momento típico, eventos aceleradores, padrão de decisão. Mínimo 150 caracteres.",
    communication_style: "Linguagem e comunicação natural: vocabulário, tom, expressões típicas, metáforas. Mínimo 150 caracteres.",
    psychological_resistances: "Barreiras emocionais e auto-sabotagem: resistências a mudanças, padrões de sabotagem, mecanismos de defesa. Mínimo 150 caracteres.",
  };
  
  for (const field of incompleteFields) {
    properties[field] = {
      type: "string",
      description: fieldDescriptions[field] || `Campo ${field}. Mínimo 150 caracteres, 3-5 frases completas.`,
    };
  }
  
  return {
    type: "object",
    properties,
    required: incompleteFields,
  };
}

// Função para fazer chamada de repair
async function repairIncompleteFields(
  lovableApiKey: string,
  segment: any,
  project_context: any,
  incompleteFields: string[],
  currentAnalysis: any
): Promise<{ repairedAnalysis: any; tokens: { input: number; output: number; total: number } }> {
  
  const repairPrompt = `
CONTEXTO: Você gerou uma análise de público-alvo, mas os seguintes campos vieram INCOMPLETOS ou MUITO CURTOS:
${incompleteFields.map(f => `- ${f}`).join('\n')}

DADOS DO PÚBLICO:
- Quem é: ${segment.who_is}
- Maior desejo: ${segment.biggest_desire}
- Maior dor: ${segment.biggest_pain}
- Tentativas falhas: ${segment.failed_attempts}
- Crenças limitantes: ${segment.beliefs}
- Comportamento: ${segment.behavior}
- Jornada: ${segment.journey}

${project_context?.brand_name ? `Marca: ${project_context.brand_name}` : ''}
${project_context?.sector ? `Setor: ${project_context.sector}` : ''}
${project_context?.central_purpose ? `Propósito: ${project_context.central_purpose}` : ''}

INSTRUÇÃO CRÍTICA:
1. Gere APENAS os campos listados acima
2. Cada campo DEVE ter NO MÍNIMO 150 caracteres
3. Escreva 3 a 5 frases completas por campo
4. NÃO deixe frases incompletas ou cortadas
5. Seja específico e detalhado

Valores atuais (incompletos) para referência:
${incompleteFields.map(f => `${f}: "${currentAnalysis[f] || '(vazio)'}"`).join('\n')}
`;

  const repairSchema = buildRepairSchema(incompleteFields);
  
  console.log(`[REPAIR] Iniciando reparo de ${incompleteFields.length} campos: ${incompleteFields.join(', ')}`);
  
  const repairResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview', // Modelo mais robusto para repair
      messages: [
        { 
          role: 'system', 
          content: 'Você é um especialista em psicologia do consumidor. Sua tarefa é COMPLETAR campos que vieram incompletos. Cada campo DEVE ter NO MÍNIMO 150 caracteres com frases completas.' 
        },
        { role: 'user', content: repairPrompt }
      ],
      temperature: 0.5,
      max_tokens: 4000,
      tools: [
        {
          type: "function",
          function: {
            name: "complete_analysis_fields",
            description: "Completa campos incompletos da análise de público. Cada campo deve ter mínimo 150 caracteres.",
            parameters: repairSchema,
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "complete_analysis_fields" } }
    }),
  });

  if (!repairResponse.ok) {
    const errorText = await repairResponse.text();
    console.error('[REPAIR] Erro na chamada de repair:', repairResponse.status, errorText);
    throw new Error(`Erro no repair: ${repairResponse.status}`);
  }

  const repairData = await repairResponse.json();
  const repairToolCall = repairData.choices?.[0]?.message?.tool_calls?.[0];
  
  if (!repairToolCall?.function?.arguments) {
    console.error('[REPAIR] Resposta de repair vazia');
    throw new Error('Resposta de repair vazia');
  }

  const repairedFields = JSON.parse(repairToolCall.function.arguments);
  
  // Merge: sobrescrever apenas campos reparados
  const mergedAnalysis = { ...currentAnalysis };
  for (const field of incompleteFields) {
    if (repairedFields[field] && typeof repairedFields[field] === 'string') {
      mergedAnalysis[field] = repairedFields[field];
      console.log(`[REPAIR] Campo ${field} reparado: ${repairedFields[field].length} chars`);
    }
  }

  const tokens = {
    input: repairData.usage?.prompt_tokens || 1000,
    output: repairData.usage?.completion_tokens || 500,
    total: repairData.usage?.total_tokens || 1500,
  };

  console.log(`[REPAIR] Tokens utilizados no repair: ${tokens.total}`);
  
  return { repairedAnalysis: mergedAnalysis, tokens };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segment, workspace_id, project_context } = await req.json();

    if (!segment || !workspace_id) {
      return new Response(
        JSON.stringify({ error: 'Segmento e workspace_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Logging detalhado para auditoria
    console.log(`[ANALYZE] Iniciando análise - workspace: ${workspace_id}, segment_id: ${segment.id || 'N/A'}`);

    // Autenticação automática via verify_jwt = true
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Erro ao obter usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar system prompt do banco de dados
    let systemPrompt = 'Você é um especialista em psicologia do consumidor, antropologia cultural e análise comportamental. Foque apenas em entender o público profundamente, sem sugerir estratégias de vendas.';
    
    try {
      const { data: promptData } = await supabase
        .from('ai_prompt_templates')
        .select('current_prompt')
        .eq('prompt_key', 'analyze_audience_psychographic')
        .eq('is_active', true)
        .single();
      
      if (promptData?.current_prompt) {
        systemPrompt = promptData.current_prompt;
        console.log('✓ Usando prompt dinâmico do banco para análise de público');
      } else {
        console.log('⚠️ Prompt não encontrado no banco, usando fallback');
      }
    } catch (error) {
      console.error('Erro ao buscar prompt do banco, usando fallback:', error);
    }

    // Construir prompt contextualizado com Identidade + Metodologia do projeto
    const prompt = `
**CONTEXTO DO PROJETO:**
${project_context?.brand_name ? `- **Marca:** ${project_context.brand_name}` : ''}
${project_context?.sector ? `- **Setor:** ${project_context.sector}` : ''}
${project_context?.central_purpose ? `- **Propósito Central:** ${project_context.central_purpose}` : ''}

${project_context?.methodology ? `
**METODOLOGIA/MÉTODO DO PROJETO:**
- **Nome do Método:** ${project_context.methodology.name || 'Não informado'}
- **Tese Central:** ${project_context.methodology.tese_central || 'Não informada'}
- **Etapas do Método:** ${project_context.methodology.etapas_metodo || 'Não informadas'}
- **Mecanismo Único:** ${project_context.methodology.mecanismo_unico || 'Não informado'}
- **Diferencial da Abordagem:** ${project_context.methodology.diferencial_abordagem || 'Não informado'}
` : ''}

---

**DADOS DO PÚBLICO:**

1. **Quem é:** ${segment.who_is}
2. **Maior desejo:** ${segment.biggest_desire}
3. **Maior dor:** ${segment.biggest_pain}
4. **Tentativas falhas:** ${segment.failed_attempts}
5. **Crenças limitantes:** ${segment.beliefs}
6. **Comportamento:** ${segment.behavior}
7. **Jornada:** ${segment.journey}

---

**INSTRUÇÃO CRÍTICA:**
Ao analisar profundamente esse público do ponto de vista antropológico e psicológico, considere:

1. **Dores específicas que a METODOLOGIA acima resolve** - Identifique como cada dor do público se conecta às etapas e à tese central do método apresentado.
2. **Mecanismo Único como solução** - Analise como o mecanismo único se relaciona com as tentativas falhas e crenças limitantes do público.
3. **Mapeamento por Etapa** - Se possível, indique em qual etapa do método cada dor seria trabalhada/resolvida.
4. **Linguagem e narrativa** - Use vocabulário que ressoe com o setor, propósito central e a abordagem metodológica apresentada.

**REQUISITO OBRIGATÓRIO:**
- Cada campo da análise DEVE ter NO MÍNIMO 150 caracteres
- Escreva pelo menos 3 a 5 frases completas por campo
- NÃO deixe nenhuma frase incompleta ou cortada

Seja específico, detalhado e focado em ENTENDER verdadeiramente quem é essa pessoa **no contexto dessa marca, setor e metodologia**.
`;

    // Chamar Lovable AI com estrutura de campos
    console.log('[ANALYZE] Gerando análise com IA (tentativa 1)...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 12000,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_audience_analysis",
              description: "Retorna análise psicográfica profunda estruturada em 15 dimensões específicas. Cada campo DEVE ter NO MÍNIMO 150 caracteres.",
              parameters: {
                type: "object",
                properties: {
                  // Core psicológico
                  psychographic_profile: {
                    type: "string",
                    description: "Perfil psicográfico completo: valores centrais que guiam decisões, estilo de vida (como passa os dias, prioridades), traços de personalidade dominantes, identidade social (grupos aos quais pertence ou aspira), autoimagem (como se vê e como quer ser visto). MÍNIMO 150 CARACTERES."
                  },
                  consciousness_level: {
                    type: "string",
                    description: "Nível de consciência do problema/solução segundo Eugene Schwartz. IMPORTANTE: Use os termos em PORTUGUÊS (Inconsciente, Consciente do Problema, Consciente da Solução, Consciente do Produto, Mais Consciente). Descreva em qual estágio o público está, por quê está nesse nível, e quais barreiras mentais enfrenta. MÍNIMO 150 CARACTERES."
                  },
                  
                  // Dimensão Emocional
                  emotional_state: {
                    type: "string",
                    description: "Estado emocional atual predominante: emoções dominantes no dia a dia (frustração, ansiedade, esperança, medo), intensidade emocional (alta/média/baixa volatilidade), gatilhos emocionais específicos que ativam reações, padrões de oscilação emocional. Mapeie sentimentos recorrentes. MÍNIMO 150 CARACTERES."
                  },
                  hidden_pain: {
                    type: "string",
                    description: "A dor real não verbalizada: o que está por trás da dor superficial, sofrimento emocional subjacente verdadeiro, o que mantém acordado à noite, dor que evita admitir por vergonha ou medo. A dor por trás da dor. MÍNIMO 150 CARACTERES."
                  },
                  primary_fear: {
                    type: "string",
                    description: "Medo fundamental que dirige comportamentos: o medo mais profundo relacionado ao problema, como esse medo se manifesta no dia a dia, consequências que tenta evitar a todo custo, cenário apocalíptico que visualiza se não resolver. MÍNIMO 150 CARACTERES."
                  },
                  emotional_desire: {
                    type: "string",
                    description: "Estado emocional desejado (além de ter/conseguir): como quer se sentir consigo mesmo, como quer ser visto pelos outros, emoções de transformação esperadas (paz, orgulho, segurança, liberdade), sentimento que busca alcançar. MÍNIMO 150 CARACTERES."
                  },
                  
                  // Dimensão Cognitiva
                  problem_misperception: {
                    type: "string",
                    description: "O que ACHA que é o problema (mas está errado): diagnóstico equivocado que faz, onde coloca a culpa incorretamente, soluções que tenta (mas não funcionam), gap entre problema percebido vs. problema real. MÍNIMO 150 CARACTERES."
                  },
                  internal_mechanism: {
                    type: "string",
                    description: "Como o problema funciona internamente (ciclo vicioso): loop comportamental/mental que perpetua o problema, sequência Gatilho → Comportamento → Consequência → Reforço, por que tentativas anteriores falharam, dinâmica psicológica que mantém travado. MÍNIMO 150 CARACTERES."
                  },
                  limiting_belief: {
                    type: "string",
                    description: "Crença central que sabota progresso: crença limitante principal (ex: 'não sou capaz', 'preciso sofrer para merecer'), origem da crença (experiências passadas), como se manifesta em decisões, evidências que usa para confirmar a crença. MÍNIMO 150 CARACTERES."
                  },
                  internal_narrative: {
                    type: "string",
                    description: "História que conta para si mesmo sobre sua situação: narrativa predominante (vítima/herói/incompetente), papel que se atribui no próprio problema, justificativas que usa repetidamente, 'script' mental que reproduz. MÍNIMO 150 CARACTERES."
                  },
                  internal_contradiction: {
                    type: "string",
                    description: "Conflitos internos entre desejos e ações: 'Quero X mas faço Y', valores conflitantes em choque, desejos opostos simultâneos, ambivalência paralisante, como essa contradição trava progresso. MÍNIMO 150 CARACTERES."
                  },
                  
                  // Dimensão Comportamental
                  dominant_behavior: {
                    type: "string",
                    description: "Padrão de ação mais frequente relacionado ao problema: comportamento automático predominante, quando ocorre (situações gatilho específicas), função que esse comportamento serve (mesmo que disfuncional), resultado que gera. Descreva com PELO MENOS 3-5 FRASES COMPLETAS. MÍNIMO 150 CARACTERES."
                  },
                  decision_trigger: {
                    type: "string",
                    description: "O que faz finalmente tomar ação: momento de 'chega!' típico, eventos que aceleram decisão, se é acumulação de fatores ou evento único, padrão de tomada de decisão (impulsivo/analítico/emocional). MÍNIMO 150 CARACTERES."
                  },
                  communication_style: {
                    type: "string",
                    description: "Linguagem e comunicação natural: vocabulário específico que usa, tom natural de fala (formal/informal, sério/descontraído), expressões típicas e gírias, metáforas e analogias que fazem sentido, como prefere receber informações. MÍNIMO 150 CARACTERES."
                  },
                  psychological_resistances: {
                    type: "string",
                    description: "Barreiras emocionais e auto-sabotagem: resistências emocionais específicas a mudanças, padrões de auto-sabotagem quando está perto de avançar, objeções internas antes de agir, mecanismos de defesa psicológica. MÍNIMO 150 CARACTERES."
                  },
                  mental_triggers: {
                    type: "object",
                    description: "Gatilhos mentais mais efetivos para este público, ranqueados de 1 a 8 por efetividade.",
                    properties: {
                      escassez: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      },
                      autoridade: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      },
                      prova_social: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      },
                      reciprocidade: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      },
                      consistencia: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      },
                      afinidade: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      },
                      antecipacao: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      },
                      exclusividade: {
                        type: "object",
                        properties: {
                          rank: { type: "number", description: "Posição 1-8 de efetividade" },
                          justificativa: { type: "string", description: "Por que este gatilho funciona (ou não) para este público" }
                        },
                        required: ["rank", "justificativa"]
                      }
                    },
                    required: ["escassez", "autoridade", "prova_social", "reciprocidade", "consistencia", "afinidade", "antecipacao", "exclusividade"]
                  }
                },
                required: [
                  "psychographic_profile",
                  "consciousness_level",
                  "emotional_state",
                  "hidden_pain",
                  "primary_fear",
                  "emotional_desire",
                  "problem_misperception",
                  "internal_mechanism",
                  "limiting_belief",
                  "internal_narrative",
                  "internal_contradiction",
                  "dominant_behavior",
                  "decision_trigger",
                  "communication_style",
                  "psychological_resistances",
                  "mental_triggers"
                ]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_audience_analysis" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na API Lovable AI:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'rate_limit', message: 'Limite de requisições excedido' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'insufficient_credits', message: 'Créditos insuficientes' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Erro ao gerar análise: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Verificar se a resposta foi truncada por limite de tokens
    const finishReason = aiData.choices?.[0]?.finish_reason;
    console.log(`[ANALYZE] finish_reason: ${finishReason}`);
    if (finishReason === 'length') {
      console.error('[ANALYZE] AVISO: Resposta da IA foi truncada por limite de tokens');
    }
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Resposta da IA vazia ou inválida');
    }

    let analysis = JSON.parse(toolCall.function.arguments);
    
    // Tokens da primeira chamada
    let totalInputTokens = aiData.usage?.prompt_tokens || 2000;
    let totalOutputTokens = aiData.usage?.completion_tokens || 3000;
    let totalTokens = aiData.usage?.total_tokens || 5000;
    
    console.log(`[ANALYZE] Tentativa 1 - Tokens: ${totalTokens} (input: ${totalInputTokens}, output: ${totalOutputTokens})`);

    // VALIDAÇÃO BLOQUEANTE
    let validation = validateAnalysis(analysis);
    
    console.log('[ANALYZE] Validação inicial:', {
      isValid: validation.isValid,
      incompleteFields: validation.incompleteFields,
      fieldSizes: validation.fieldSizes,
    });

    // Se houver campos incompletos, tentar AUTO-REPAIR
    if (!validation.isValid && validation.incompleteFields.length > 0) {
      console.log(`[ANALYZE] Iniciando auto-repair para ${validation.incompleteFields.length} campos incompletos`);
      
      try {
        const repairResult = await repairIncompleteFields(
          lovableApiKey,
          segment,
          project_context,
          validation.incompleteFields,
          analysis
        );
        
        analysis = repairResult.repairedAnalysis;
        
        // Somar tokens do repair
        totalInputTokens += repairResult.tokens.input;
        totalOutputTokens += repairResult.tokens.output;
        totalTokens += repairResult.tokens.total;
        
        console.log(`[ANALYZE] Tokens totais após repair: ${totalTokens}`);
        
        // Re-validar após repair
        validation = validateAnalysis(analysis);
        
        console.log('[ANALYZE] Validação após repair:', {
          isValid: validation.isValid,
          incompleteFields: validation.incompleteFields,
        });
        
      } catch (repairError) {
        console.error('[ANALYZE] Erro no auto-repair:', repairError);
        // Continua com a análise incompleta, mas vai falhar na validação final
      }
    }

    // VALIDAÇÃO FINAL BLOQUEANTE
    if (!validation.isValid) {
      console.error('[ANALYZE] FALHA: Análise permanece incompleta após repair', {
        workspace_id,
        segment_id: segment.id || 'N/A',
        incompleteFields: validation.incompleteFields,
        fieldSizes: validation.fieldSizes,
      });
      
      // NÃO debitar créditos - retornar erro
      return new Response(
        JSON.stringify({
          error: 'incomplete_analysis',
          incomplete_fields: validation.incompleteFields,
          message: 'A análise veio incompleta. Clique em Regenerar novamente.',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SUCESSO - Debitar créditos SOMENTE se válido
    console.log('[ANALYZE] ✓ Análise válida - debitando créditos');
    
    const { data: debitResult, error: debitError } = await supabase.rpc(
      'debit_workspace_credits',
      {
        p_workspace_id: workspace_id,
        p_model_name: 'google/gemini-2.5-flash',
        tokens_used: totalTokens,
        p_input_tokens: totalInputTokens,
        p_output_tokens: totalOutputTokens,
        generation_id: null,
        p_user_id: user.id,
      }
    );

    if (debitError) {
      console.error('Erro ao debitar créditos:', debitError);
      throw new Error('Erro ao processar créditos');
    }

    console.log('[ANALYZE] Créditos debitados com sucesso:', debitResult);

    return new Response(
      JSON.stringify({ 
        analysis,
        tokens_used: totalTokens,
        credits_debited: debitResult?.debited || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erro na função analyze-audience:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro desconhecido' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
