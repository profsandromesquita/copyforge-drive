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
              description: "Gera análise psicográfica profunda de público-alvo",
              parameters: {
                type: "object",
                properties: {
                  consciousness_level: {
                    type: "string",
                    description: "Nível de consciência (Eugene Schwartz): em qual dos 5 estágios o público está? Explique o mindset atual e barreiras para avançar. Seja específico sobre o que essa pessoa já sabe, o que ainda não percebeu e quais são os bloqueios mentais que a impedem de evoluir para o próximo nível."
                  },
                  psychographic_profile: {
                    type: "string",
                    description: "Perfil psicográfico completo: valores centrais que guiam decisões, estilo de vida (rotina, prioridades, contexto de vida), traços de personalidade relevantes (considere Big Five se aplicável), identidade social (a quais grupos pertence ou quer pertencer), autoimagem (como se vê e como quer ser vista pelos outros)."
                  },
                  pains_frustrations: {
                    type: "string",
                    description: "Mapeamento completo de dores: dores principais (as mais intensas e urgentes), dores secundárias (consequências das principais), frustrações diárias específicas, sentimentos negativos recorrentes, impactos emocionais e práticos na vida pessoal/profissional. Seja concreto e específico."
                  },
                  desires_aspirations: {
                    type: "string",
                    description: "Desejos verdadeiros: o que REALMENTE quer alcançar (vá além do óbvio, busque a motivação profunda), aspirações de longo prazo, versão ideal de si mesmo (quem quer se tornar), mudanças desejadas na vida, sonhos e objetivos (mesmo os que parecem inalcançáveis)."
                  },
                  behaviors_habits: {
                    type: "string",
                    description: "Comportamentos observáveis: rotina diária típica, hábitos de consumo de conteúdo (o que lê, assiste, ouve), onde passa o tempo (online: redes sociais, fóruns, sites / offline: lugares físicos), rituais e padrões repetitivos, como toma decisões (impulsivo, analítico, emocional), triggers comportamentais."
                  },
                  language_communication: {
                    type: "string",
                    description: "Como se comunica naturalmente: vocabulário específico (liste 10-15 termos/frases que essa pessoa realmente usa), tom natural predominante (formal/informal/técnico/coloquial), gírias, expressões regionais ou de nicho, metáforas e analogias que usa, como descreve seus problemas (quais palavras usa para expressar dores)."
                  },
                  influences_references: {
                    type: "string",
                    description: "Influências e referências: autoridades que segue e confia, criadores de conteúdo (YouTubers, podcasters, influenciadores), marcas favoritas e por que as admira, comunidades/grupos dos quais faz parte (online e offline), fontes de informação que considera confiáveis, quem são seus modelos de referência."
                  },
                  internal_barriers: {
                    type: "string",
                    description: "Barreiras e bloqueios internos: crenças limitantes profundas (o que acredita que é verdade mas a limita), medos específicos e irracionais, padrões de auto-sabotagem, resistências emocionais (o que evita sentir), experiências passadas traumáticas que bloqueiam ação, contradições internas (quer X mas faz Y)."
                  },
                  anti_persona: {
                    type: "string",
                    description: "Anti-persona detalhada: características demográficas e psicográficas de quem definitivamente NÃO é esse público, perfil oposto, valores e crenças conflitantes, comportamentos excludentes, red flags que indicam que não é esse público, por que essas pessoas não se identificariam com este segmento."
                  }
                },
                required: [
                  "consciousness_level",
                  "psychographic_profile",
                  "pains_frustrations",
                  "desires_aspirations",
                  "behaviors_habits",
                  "language_communication",
                  "influences_references",
                  "internal_barriers",
                  "anti_persona"
                ],
                additionalProperties: false
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
