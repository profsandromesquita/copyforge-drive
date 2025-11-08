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

    // Construir prompt otimizado para análise avançada focada em copywriting
    const prompt = `
Você é um especialista em copywriting direto, psicologia do consumidor e análise de público-alvo. 
Sua missão é gerar uma análise ULTRA-ACIONÁVEL para criação de copies de vendas.

**DADOS DO PÚBLICO:**

1. **Quem é:** ${segment.who_is}
2. **Maior desejo:** ${segment.biggest_desire}
3. **Maior dor:** ${segment.biggest_pain}
4. **Tentativas falhas:** ${segment.failed_attempts}
5. **Crenças limitantes:** ${segment.beliefs}
6. **Comportamento:** ${segment.behavior}
7. **Jornada:** ${segment.journey}

---

Analise profundamente esse público e retorne insights ULTRA-ESPECÍFICOS e ACIONÁVEIS para copywriting.
Seja objetivo, direto e focado no que REALMENTE move vendas.
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
          { role: 'system', content: 'Você é um especialista em análise de público-alvo e copywriting estratégico.' },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_audience_analysis",
              description: "Gera análise estruturada de público-alvo para copywriting",
              parameters: {
                type: "object",
                properties: {
                  consciousness_level: {
                    type: "string",
                    description: "Identifique em qual dos 5 níveis de Eugene Schwartz esse público está (Inconsciente, Consciente do Problema, Consciente da Solução, Consciente do Produto, Mais Consciente) e explique as implicações para a copy"
                  },
                  vocabulary: {
                    type: "string",
                    description: "Liste 10-15 palavras/frases exatas que essa pessoa usa, o tom ideal (formal, informal, técnico, motivacional) e o que NUNCA dizer"
                  },
                  objections: {
                    type: "string",
                    description: "Liste as 5 principais objeções ranqueadas por prioridade com respostas específicas para neutralizar cada uma"
                  },
                  copy_angles: {
                    type: "string",
                    description: "Sugira 3-5 formas diferentes de 'fisgar' esse público com ângulos de entrada variados"
                  },
                  mental_triggers: {
                    type: "string",
                    description: "Liste os TOP 3 gatilhos mentais que funcionam melhor e explique por quê. Liste também gatilhos a evitar"
                  },
                  copy_structure: {
                    type: "string",
                    description: "Recomende o melhor framework (PAS, AIDA, BAB, etc), explique por que funciona para esse público e sugira um esqueleto básico"
                  },
                  timing_context: {
                    type: "string",
                    description: "Indique o melhor momento para impactar (horário, dia, situação) e gatilhos de urgência específicos que funcionam"
                  },
                  anti_persona: {
                    type: "string",
                    description: "Descreva quem NÃO deveria comprar e por que isso importa. Características de clientes problemáticos"
                  },
                  example_copy: {
                    type: "string",
                    description: "Crie um parágrafo de copy exemplo usando todos os insights acima (2-4 linhas)"
                  }
                },
                required: [
                  "consciousness_level",
                  "vocabulary",
                  "objections",
                  "copy_angles",
                  "mental_triggers",
                  "copy_structure",
                  "timing_context",
                  "anti_persona",
                  "example_copy"
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
