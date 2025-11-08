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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Construir prompt para análise avançada
    const prompt = `
Você é um especialista em marketing e psicologia do consumidor. Analise profundamente este público-alvo e gere uma análise estratégica completa.

**PÚBLICO-ALVO:**

1. **Quem é:** ${segment.who_is}
2. **Maior desejo:** ${segment.biggest_desire}
3. **Maior dor:** ${segment.biggest_pain}
4. **Tentativas falhas:** ${segment.failed_attempts}
5. **Crenças limitantes:** ${segment.beliefs}
6. **Comportamento:** ${segment.behavior}
7. **Jornada:** ${segment.journey}

---

Gere uma análise detalhada em markdown, estruturada nos seguintes tópicos:

## 🎯 Perfil Psicológico Profundo
(Análise dos aspectos emocionais, medos ocultos, motivações verdadeiras)

## 🧠 Padrões de Pensamento e Comportamento
(Como essa pessoa toma decisões, o que a paralisa, o que a move)

## 💡 Gatilhos Mentais Mais Efetivos
(Quais gatilhos funcionam melhor e por quê)

## 🗣️ Estratégia de Comunicação
(Como falar com essa pessoa, palavras e frases que ressoam)

## 🚧 Objeções Previstas e Como Contorná-las
(Principais resistências e respostas estratégicas)

## 🎨 Tom de Voz e Linguagem Recomendados
(Estilo de comunicação ideal para esse público)

## 📈 Jornada de Conversão Recomendada
(Etapas ideais para levar do interesse à compra)

Seja específico, estratégico e baseado em psicologia do consumidor. Foque em insights acionáveis para copywriting.
`;

    // Chamar Lovable AI
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
    const analysis = aiData.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('Resposta da IA vazia');
    }

    // Registrar uso de tokens (estimado)
    const totalTokens = (aiData.usage?.total_tokens || 5000);
    const inputTokens = (aiData.usage?.prompt_tokens || 2000);
    const outputTokens = (aiData.usage?.completion_tokens || 3000);

    console.log(`Tokens utilizados: ${totalTokens} (input: ${inputTokens}, output: ${outputTokens})`);

    // Debitar créditos do workspace
    const { data: debitResult, error: debitError } = await supabase.rpc(
      'debit_workspace_credits',
      {
        p_workspace_id: workspace_id,
        p_model_name: 'google/gemini-2.5-flash',
        tokens_used: totalTokens,
        p_input_tokens: inputTokens,
        p_output_tokens: outputTokens,
        generation_id: crypto.randomUUID(),
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
