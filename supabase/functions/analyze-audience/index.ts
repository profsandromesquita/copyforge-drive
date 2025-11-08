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

Gere uma análise em markdown focada em AÇÃO IMEDIATA para criar copies. Use esta estrutura:

## 🎯 1. NÍVEL DE CONSCIÊNCIA
Identifique em qual dos 5 níveis de Eugene Schwartz esse público está:
- [ ] Inconsciente (não sabe que tem problema)
- [ ] Consciente do Problema
- [ ] Consciente da Solução
- [ ] Consciente do Produto
- [ ] Mais Consciente

**Implicação:** O que isso significa para a copy (como iniciar, que informações dar)

## 💬 2. VOCABULÁRIO E LINGUAGEM
- **Palavras/Frases que essa pessoa USA:** [liste 10-15 expressões EXATAS]
- **Tom ideal:** [formal, informal, técnico, motivacional, etc.]
- **O QUE NUNCA DIZER:** [palavras/abordagens que afastam]

## 🚧 3. OBJEÇÕES (EM ORDEM DE IMPORTÂNCIA)
Liste as 5 principais objeções ranqueadas por prioridade:
1. **[Objeção]** → Como neutralizar: [resposta específica]
2. **[Objeção]** → Como neutralizar: [resposta específica]
3. **[Objeção]** → Como neutralizar: [resposta específica]
4. **[Objeção]** → Como neutralizar: [resposta específica]
5. **[Objeção]** → Como neutralizar: [resposta específica]

## 🎣 4. ÂNGULOS DE ENTRADA (COPY ANGLES)
Sugira 3-5 formas diferentes de "fisgar" esse público:
1. **[Nome do Ângulo]:** [como aplicar]
2. **[Nome do Ângulo]:** [como aplicar]
3. **[Nome do Ângulo]:** [como aplicar]

## 🧠 5. GATILHOS MENTAIS PRIORITÁRIOS
- **TOP 3 que FUNCIONAM:** [Liste e explique POR QUE funcionam com esse público]
- **Gatilhos a EVITAR:** [Liste e explique por que podem repelir]

## 📝 6. ESTRUTURA DE COPY RECOMENDADA
- **Melhor framework:** [PAS, AIDA, BAB, etc.]
- **Por quê funciona:** [razão específica para esse público]
- **Esqueleto sugerido:** [outline básico]

## ⏰ 7. TIMING E CONTEXTO
- **Melhor momento para impactar:** [horário, dia, situação]
- **Gatilhos de urgência específicos:** [o que cria senso de urgência para esse público]

## ⚠️ 8. PERFIL ANTI-PERSONA
Quem NÃO deveria comprar (e por quê isso importa):
- [Características de clientes problemáticos]

## 🎨 9. EXEMPLO DE COPY
Crie um parágrafo de copy exemplo usando tudo acima (2-3 linhas):
"[copy exemplo]"

---

Seja ULTRA-ESPECÍFICO. Cada insight deve ser acionável. Foque no que REALMENTE move vendas.
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
