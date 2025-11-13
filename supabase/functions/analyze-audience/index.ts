import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segment, workspace_id } = await req.json();

    if (!segment || !workspace_id) {
      return new Response(
        JSON.stringify({ error: 'Segmento e workspace_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair user_id do JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticação ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    // Criar cliente com o token do usuário para pegar o user_id
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
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
        .eq('prompt_key', 'analyze_audience_base')
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

    // Construir prompt otimizado para análise profunda de PÚBLICO (sem foco em vendas)
    const prompt = `
**DADOS DO PÚBLICO:**

1. **Quem é:** ${segment.who_is}
2. **Maior desejo:** ${segment.biggest_desire}
3. **Maior dor:** ${segment.biggest_pain}
4. **Tentativas falhas:** ${segment.failed_attempts}
5. **Crenças limitantes:** ${segment.beliefs}
6. **Comportamento:** ${segment.behavior}
7. **Jornada:** ${segment.journey}

---

Analise profundamente esse público do ponto de vista antropológico e psicológico.
Seja específico, detalhado e focado em ENTENDER verdadeiramente quem é essa pessoa.
`;

    // Chamar Lovable AI com estrutura de campos
    console.log('Gerando análise com IA...');
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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_audience_analysis",
              description: "Retorna análise psicográfica profunda estruturada em 15 dimensões específicas",
              parameters: {
                type: "object",
                properties: {
                  // Core psicológico
                  psychographic_profile: {
                    type: "string",
                    description: "Perfil psicográfico completo: valores centrais que guiam decisões, estilo de vida (como passa os dias, prioridades), traços de personalidade dominantes, identidade social (grupos aos quais pertence ou aspira), autoimagem (como se vê e como quer ser visto)."
                  },
                  consciousness_level: {
                    type: "string",
                    description: "Nível de consciência do problema/solução segundo Eugene Schwartz. IMPORTANTE: Use os termos em PORTUGUÊS (Inconsciente, Consciente do Problema, Consciente da Solução, Consciente do Produto, Mais Consciente). Descreva em qual estágio o público está, por quê está nesse nível, e quais barreiras mentais enfrenta."
                  },
                  
                  // Dimensão Emocional
                  emotional_state: {
                    type: "string",
                    description: "Estado emocional atual predominante: emoções dominantes no dia a dia (frustração, ansiedade, esperança, medo), intensidade emocional (alta/média/baixa volatilidade), gatilhos emocionais específicos que ativam reações, padrões de oscilação emocional. Mapeie sentimentos recorrentes."
                  },
                  hidden_pain: {
                    type: "string",
                    description: "A dor real não verbalizada: o que está por trás da dor superficial, sofrimento emocional subjacente verdadeiro, o que mantém acordado à noite, dor que evita admitir por vergonha ou medo. A dor por trás da dor."
                  },
                  primary_fear: {
                    type: "string",
                    description: "Medo fundamental que dirige comportamentos: o medo mais profundo relacionado ao problema, como esse medo se manifesta no dia a dia, consequências que tenta evitar a todo custo, cenário apocalíptico que visualiza se não resolver."
                  },
                  emotional_desire: {
                    type: "string",
                    description: "Estado emocional desejado (além de ter/conseguir): como quer se sentir consigo mesmo, como quer ser visto pelos outros, emoções de transformação esperadas (paz, orgulho, segurança, liberdade), sentimento que busca alcançar."
                  },
                  
                  // Dimensão Cognitiva
                  problem_misperception: {
                    type: "string",
                    description: "O que ACHA que é o problema (mas está errado): diagnóstico equivocado que faz, onde coloca a culpa incorretamente, soluções que tenta (mas não funcionam), gap entre problema percebido vs. problema real."
                  },
                  internal_mechanism: {
                    type: "string",
                    description: "Como o problema funciona internamente (ciclo vicioso): loop comportamental/mental que perpetua o problema, sequência Gatilho → Comportamento → Consequência → Reforço, por que tentativas anteriores falharam, dinâmica psicológica que mantém travado."
                  },
                  limiting_belief: {
                    type: "string",
                    description: "Crença central que sabota progresso: crença limitante principal (ex: 'não sou capaz', 'preciso sofrer para merecer'), origem da crença (experiências passadas), como se manifesta em decisões, evidências que usa para confirmar a crença."
                  },
                  internal_narrative: {
                    type: "string",
                    description: "História que conta para si mesmo sobre sua situação: narrativa predominante (vítima/herói/incompetente), papel que se atribui no próprio problema, justificativas que usa repetidamente, 'script' mental que reproduz."
                  },
                  internal_contradiction: {
                    type: "string",
                    description: "Conflitos internos entre desejos e ações: 'Quero X mas faço Y', valores conflitantes em choque, desejos opostos simultâneos, ambivalência paralisante, como essa contradição trava progresso."
                  },
                  
                  // Dimensão Comportamental
                  dominant_behavior: {
                    type: "string",
                    description: "Padrão de ação mais frequente relacionado ao problema: comportamento automático predominante, quando ocorre (situações gatilho específicas), função que esse comportamento serve (mesmo que disfuncional), resultado que gera."
                  },
                  decision_trigger: {
                    type: "string",
                    description: "O que faz finalmente tomar ação: momento de 'chega!' típico, eventos que aceleram decisão, se é acumulação de fatores ou evento único, padrão de tomada de decisão (impulsivo/analítico/emocional)."
                  },
                  communication_style: {
                    type: "string",
                    description: "Linguagem e comunicação natural: vocabulário específico que usa, tom natural de fala (formal/informal, sério/descontraído), expressões típicas e gírias, metáforas e analogias que fazem sentido, como prefere receber informações."
                  },
                  psychological_resistances: {
                    type: "string",
                    description: "Barreiras emocionais e auto-sabotagem: resistências emocionais específicas a mudanças, padrões de auto-sabotagem quando está perto de avançar, objeções internas antes de agir, mecanismos de defesa psicológica."
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
                  "psychological_resistances"
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
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Resposta da IA vazia ou inválida');
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Registrar uso de tokens (estimado)
    const totalTokens = (aiData.usage?.total_tokens || 5000);
    const inputTokens = (aiData.usage?.prompt_tokens || 2000);
    const outputTokens = (aiData.usage?.completion_tokens || 3000);

    console.log(`Tokens utilizados: ${totalTokens} (input: ${inputTokens}, output: ${outputTokens})`);

    // Debitar créditos do workspace (sem generation_id pois análise de público não é copy)
    const { data: debitResult, error: debitError } = await supabase.rpc(
      'debit_workspace_credits',
      {
        p_workspace_id: workspace_id,
        p_model_name: 'google/gemini-2.5-flash',
        tokens_used: totalTokens,
        p_input_tokens: inputTokens,
        p_output_tokens: outputTokens,
        generation_id: null,
        p_user_id: user.id,
      }
    );

    if (debitError) {
      console.error('Erro ao debitar créditos:', debitError);
      throw new Error('Erro ao processar créditos');
    }

    console.log('Créditos debitados com sucesso:', debitResult);

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
