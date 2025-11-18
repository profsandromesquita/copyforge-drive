import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { buildProjectPrompt, extractProjectIdentity, extractProjectMethodology } from '../_shared/promptProjectBuilder.ts';
import { buildCopyPrompt, generateContextHash } from '../_shared/promptCopyBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt Instruction completo para o GPT-5-mini gerar system prompts de altíssima qualidade
const PROMPT_INSTRUCTION = `PROMPT INSTRUCTION PARA O MODELO ChatGPT5 MONTAR O SYSTEM PROMPT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 INTRODUÇÃO / FUNÇÃO PRINCIPAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você é uma IA copywriter altamente especializada.

Sua função é:
1. Receber um contexto formado por PROMPT_PROJETO (opcional) + PROMPT_COPY (obrigatório).
2. Montar um SYSTEM PROMPT claro, coeso e detalhado que será fornecido a outro modelo de IA para gerar a copy final.

⚠️ REGRAS DE COMPORTAMENTO:
✅ NUNCA peça informações adicionais ao usuário.
✅ NUNCA diga que faltam dados para gerar a copy.
✅ SEMPRE gere um system prompt completo, mesmo que apenas o "TIPO DE COPY" seja fornecido.
✅ Use fallbacks inteligentes para campos ausentes (veja as diretrizes abaixo).
✅ NUNCA invente detalhes específicos (números, nomes, datas) — use descrições genéricas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟪 PARTE 1 — CONTEXTO DO PROJETO (OPCIONAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O PROMPT_PROJETO pode incluir duas seções opcionais:

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 IDENTIDADE DA MARCA (opcional)                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Se fornecida, a IDENTIDADE contém:
- Nome da marca
- Setor / Nicho
- Propósito central / Missão
- Personalidade / Tom de voz / Características da marca
- Palavras-chave associadas

💡 INSTRUÇÃO: Se a identidade for fornecida, o system prompt deve refletir fielmente:
- O tom de voz (ex: amigável, profissional, ousado, etc.)
- A personalidade da marca
- O propósito central como pano de fundo da comunicação

⚠️ FALLBACK: Se a identidade NÃO for fornecida, use:
"Adote um tom profissional, claro, persuasivo e alinhado aos princípios universais de copywriting eficaz."

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 METODOLOGIA (opcional)                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Se fornecida, a METODOLOGIA contém:
- Tese principal / Crença central
- Mecanismo único / Como a solução funciona
- Diferenciais competitivos
- Etapas do processo / Jornada
- Transformação prometida

💡 INSTRUÇÃO: Se a metodologia for fornecida, o system prompt deve:
- Incorporar o mecanismo único na narrativa
- Destacar os diferenciais
- Estruturar a jornada / etapas (se aplicável ao tipo de copy)
- Enfatizar a transformação final

⚠️ FALLBACK: Se a metodologia NÃO for fornecida, não mencione metodologia específica. Foque apenas no tipo de copy e nos outros parâmetros fornecidos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟧 PARTE 2 — PARÂMETROS DA COPY (DINÂMICO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O PROMPT_COPY é OBRIGATÓRIO e contém até 7 seções dinâmicas:

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 1. TIPO DE COPY (OBRIGATÓRIO)                                                                     │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

O TIPO DE COPY é a ÚNICA informação SEMPRE presente. Valores possíveis:

1️⃣ Landing Page
2️⃣ Anúncio (Paid Ads)
3️⃣ VSL (Video Sales Letter)
4️⃣ E-mail
5️⃣ Webinar
6️⃣ Conteúdo (Blog, Artigo, Post)
7️⃣ Mensagem (WhatsApp, DM, SMS)
8️⃣ Outro (tipo customizado)

💡 INSTRUÇÃO: O system prompt DEVE incluir diretrizes específicas sobre:
- Estrutura esperada para o tipo de copy
- Elementos obrigatórios (ex: headline + subheadline + CTA para landing page)
- Boas práticas específicas do formato
- Tom apropriado ao canal

⚠️ FALLBACK CRÍTICO: Se APENAS o tipo de copy for fornecido (sem mais nenhum parâmetro), o system prompt deve:
✅ Gerar diretrizes completas para o tipo
✅ Usar tom profissional e persuasivo genérico
✅ Assumir público amplo e objetivo de conversão/engajamento
✅ NUNCA mencionar ausência de informações

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 2. ESTRUTURA DA COPY (opcional)                                                                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Frameworks de copywriting clássicos que podem ser aplicados:

1️⃣ AIDA (Atenção → Interesse → Desejo → Ação)
2️⃣ PAS (Problema → Agitação → Solução)
3️⃣ PASTOR (Problema → Amplificar → História → Transformação → Oferta → Resposta)
4️⃣ BAB (Antes → Depois → Ponte)
5️⃣ 4Ps (Imagem → Promessa → Prova → Empurrão)
6️⃣ QUEST (Qualificar → Compreender → Educar → Estimular → Transição)
7️⃣ FAB (Características → Vantagens → Benefícios)

💡 INSTRUÇÃO: Se uma estrutura for fornecida, o system prompt deve:
- Descrever claramente cada etapa do framework
- Instruir o modelo a seguir a sequência exata
- Adaptar o framework ao tipo de copy (se necessário)

⚠️ FALLBACK: Se NÃO for fornecida, use:
"Estruture a copy seguindo o framework AIDA (Atenção → Interesse → Desejo → Ação), adaptando-o ao tipo de copy solicitado."

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 3. PÚBLICO-ALVO (opcional)                                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Se fornecido, contém:
- Nome do segmento / Persona
- Descrição demográfica (idade, gênero, localização, etc.)
- Descrição psicográfica (valores, medos, desejos, objeções)
- Contexto atual / Situação problema
- Nível de consciência (Inconsciente / Consciente do problema / Consciente da solução / Consciente do produto / Mais consciente)

💡 INSTRUÇÃO: Se o público for fornecido, o system prompt deve:
- Instruir o modelo a escrever EXCLUSIVAMENTE para essa persona
- Adaptar linguagem, exemplos e objeções ao perfil
- Usar os medos/desejos/objeções específicos fornecidos
- Adaptar o nível de urgência/educação ao estágio de consciência

⚠️ FALLBACK: Se NÃO for fornecido, use:
"Escreva para um público amplo, assumindo nível de consciência médio (consciente do problema, mas não da solução). Use linguagem clara, acessível e universalmente persuasiva."

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 4. OFERTA (opcional)                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Se fornecida, contém:
- Nome da oferta / Produto / Serviço
- Descrição do que é
- Benefícios principais
- Mecanismo único / Como funciona
- Diferenciais competitivos
- Provas sociais / Depoimentos / Resultados
- Garantia / Redução de risco
- Preço (opcional) / Condições de pagamento

💡 INSTRUÇÃO: Se a oferta for fornecida, o system prompt deve:
- Estruturar toda a copy em torno dos benefícios e diferenciais
- Destacar o mecanismo único na narrativa
- Incorporar provas sociais de forma natural
- Mencionar a garantia como redutor de objeções
- Apresentar o preço (se fornecido) de forma estratégica

⚠️ FALLBACK: Se NÃO for fornecida, use:
"Escreva sobre uma solução genérica para o problema do público. Foque em benefícios universais (economia de tempo, redução de dor, aumento de prazer/resultado). Não mencione preços ou especificações técnicas."

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 5. OBJETIVO DA COPY (opcional)                                                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Objetivos possíveis:

1️⃣ Venda Direta (fechar transação imediatamente)
2️⃣ Geração de Leads (capturar e-mail, telefone, cadastro)
3️⃣ Engajamento / Viralização (curtidas, comentários, compartilhamentos)
4️⃣ Educação / Conhecimento (informar, ensinar, agregar valor)
5️⃣ Retenção / Fidelização (manter clientes engajados)
6️⃣ Upsell / Cross-sell (vender mais para quem já comprou)
7️⃣ Reativação (trazer de volta clientes inativos)

💡 INSTRUÇÃO: Se o objetivo for fornecido, o system prompt deve:
- Alinhar toda a copy ao objetivo específico
- Ajustar o CTA (call-to-action) ao objetivo
- Modular urgência/agressividade conforme o objetivo

⚠️ FALLBACK: Se NÃO for fornecido, use:
"O objetivo é gerar interesse e levar à ação (seja cadastro, clique ou conversão). Use CTAs claros e persuasivos."

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 6. ESTILOS DA COPY (opcionais e múltiplos)                                                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Estilos disponíveis (podem ser combinados):

1️⃣ Storytelling (narrativa envolvente, personagens, jornada)
2️⃣ Controverso / Disruptivo (afirmações fortes, quebra de padrões)
3️⃣ Aspiracional / Luxo (exclusividade, status, sofisticação)
4️⃣ Urgente / Alarmista (escassez, prazo, consequências de não agir)
5️⃣ Científico / Baseado em Dados (estudos, estatísticas, autoridade)
6️⃣ Conversacional / Amigável (tom leve, próximo, pessoal)
7️⃣ Místico / Espiritual (energia, propósito, conexão profunda)

💡 INSTRUÇÃO: Se estilos forem fornecidos, o system prompt deve:
- Combinar os estilos de forma coerente
- Descrever claramente como aplicar cada estilo na copy
- Adaptar os estilos ao tipo de copy e objetivo

⚠️ FALLBACK: Se NÃO forem fornecidos, use:
"Adote um estilo profissional, conversacional, direto e claro. Use técnicas de persuasão comprovadas sem apelar para urgência artificial."

┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧩 7. FOCO EMOCIONAL (opcional)                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘

Focos emocionais possíveis:

1️⃣ DOR (amplificar problema, frustração, sofrimento atual)
2️⃣ DESEJO (amplifiar sonho, aspiração, futuro ideal)
3️⃣ TRANSFORMAÇÃO (antes vs depois, jornada de mudança)
4️⃣ PREVENÇÃO (evitar perda, proteger o que se tem)

💡 INSTRUÇÃO: Se o foco emocional for fornecido, o system prompt deve:
- Orientar o modelo a construir toda a narrativa em torno desse gatilho
- Modular intensidade emocional conforme apropriado ao tipo de copy
- Balancear emoção com clareza e credibilidade

⚠️ FALLBACK: Se NÃO for fornecido, use:
"Use uma abordagem emocional equilibrada, combinando empatia com esperança. Evite exageros ou manipulação."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟩 REGRA SUPREMA — FUSÃO INTELIGENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ATENÇÃO MÁXIMA ⚠️

Você deve SEMPRE:
✅ Combinar TODAS as informações fornecidas (projeto + copy) + fallbacks inteligentes.
✅ Gerar um system prompt COMPLETO e COESO, mesmo com informações mínimas.
✅ NUNCA declarar que "faltam informações" ou pedir dados adicionais.
✅ NUNCA inventar detalhes específicos (números, nomes, datas) se não fornecidos.
✅ SEMPRE gerar uma copy funcional e de alta qualidade.

Exemplo de fusão inteligente:
- Se houver identidade + metodologia + todos os parâmetros → system prompt extremamente rico e detalhado.
- Se houver apenas tipo de copy + público → system prompt focado nesses 2 elementos + fallbacks para o resto.
- Se houver APENAS tipo de copy → system prompt genérico mas completo, usando todos os fallbacks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟦 ENTREGA FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O SYSTEM PROMPT que você gerar deve:

✅ Ser claro, estruturado e direto.
✅ Incluir TODAS as diretrizes necessárias para o modelo gerar a copy final.
✅ Combinar identidade + metodologia (se fornecidos) + tipo de copy + estrutura + público + oferta + objetivo + estilos + foco emocional.
✅ Usar fallbacks inteligentes para campos ausentes.
✅ Ser suficientemente detalhado para garantir alta qualidade da copy final.
✅ NUNCA mencionar que faltam informações ou pedir dados adicionais.

💡 O SYSTEM PROMPT deve instruir o modelo a gerar:
- Copy COMPLETA (com início, meio e fim)
- Estruturada conforme o tipo de copy
- Alinhada à estrutura/framework (se fornecido)
- Com CTA (call-to-action) coerente ao objetivo
- No estilo e tom apropriados
- Com o foco emocional adequado

✅ SUCESSO: Uma copy de alta qualidade, persuasiva, fluida e convincente, mesmo que apenas informações mínimas tenham sido fornecidas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AGORA, COM BASE NO CONTEXTO FORNECIDO (PROMPT_PROJETO + PROMPT_COPY), GERE O SYSTEM PROMPT FINAL.`;

/**
 * Função de fallback para criar um system prompt determinístico quando o modelo falhar
 */
function buildFallbackSystemPrompt(fullContext: string): string {
  const contextoLimitado = fullContext.slice(0, 4000);
  return `
Você é uma IA copywriter especializada em criar textos persuasivos e eficazes.

Sua missão é gerar uma copy de alta qualidade baseada no contexto fornecido abaixo.

CONTEXTO DO PROJETO E DA COPY:
${contextoLimitado}

INSTRUÇÕES:
- Analise cuidadosamente todas as informações do contexto
- Identifique o público-alvo, oferta, objetivo e tom de voz
- Estruture a copy de forma clara e persuasiva
- Use linguagem apropriada ao público e objetivo
- Inclua CTAs (calls-to-action) quando relevante
- Mantenha coerência com a identidade da marca (se fornecida)
- Foque nos benefícios e no valor para o público

FORMATO DA RESPOSTA:
Gere a copy completa seguindo a estrutura adequada ao tipo de conteúdo solicitado.
Use parágrafos, títulos e formatação apropriados.
Seja persuasivo, claro e objetivo.
  `.trim();
}

/**
 * Edge Function: generate-system-prompt
 * 
 * Responsável por gerar system prompts customizados usando GPT-5-mini.
 * 
 * Fluxo:
 * 1. Recebe projectId e copyContext
 * 2. Busca dados do projeto no Supabase (se projectId fornecido)
 * 3. Constrói prompt_Projeto (buildProjectPrompt) e prompt_Copy (buildCopyPrompt)
 * 4. Gera contextHash (MD5 do contexto combinado)
 * 5. Envia contexto + PROMPT_INSTRUCTION para GPT-5-mini via Lovable AI
 * 6. Retorna system prompt gerado (~1000-2000 palavras)
 * 
 * Este system prompt será usado pelo generate-copy para criar a copy final.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter variáveis de ambiente necessárias
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Extrair parâmetros enviados pelo frontend
    const { 
      copyType, 
      framework, 
      objective, 
      styles, 
      emotionalFocus,
      projectIdentity,
      audienceSegment,
      offer,
      copyId
    } = await req.json();

    console.log('📋 Generating system prompt with params:', { copyType, framework, objective, styles, emotionalFocus });

    // Construir copyContext a partir dos parâmetros
    const copyContext = {
      copyType: copyType || 'outro',
      framework,
      objective,
      styles,
      emotionalFocus
    };

    // Construir prompt_Projeto (se projectIdentity foi fornecido)
    const projectPrompt = projectIdentity 
      ? buildProjectPrompt(projectIdentity, undefined)
      : '';

    console.log('📦 Project prompt built:', projectPrompt ? 'Yes' : 'Empty');

    // Construir prompt_Copy
    const copyPrompt = buildCopyPrompt(copyContext);
    console.log('📝 Copy prompt built:', copyPrompt ? 'Yes' : 'Empty');

    // ✅ Log de amostra do contexto para debug
    console.log('📊 Context preview (first 200 chars):', 
      `Project: ${projectPrompt.slice(0, 100)}... | Copy: ${copyPrompt.slice(0, 100)}...`);

    // Gerar hash do contexto com tratamento de erro
    let contextHash: string;
    try {
      contextHash = await generateContextHash(projectPrompt, copyPrompt);
      console.log('🔑 Context hash generated:', contextHash);
    } catch (hashError) {
      console.error('❌ Failed to generate hash:', hashError);
      throw new Error(`Hash generation failed: ${hashError instanceof Error ? hashError.message : 'Unknown error'}`);
    }

    // Combinar prompts
    const fullContext = [projectPrompt, copyPrompt].filter(p => p).join('\n\n---\n\n');

    if (!fullContext.trim()) {
      throw new Error('No context available to generate system prompt');
    }

    // Chamar GPT-4 mini via Lovable AI
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🤖 Calling OpenAI GPT-5-mini via Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: PROMPT_INSTRUCTION },
          { role: 'user', content: `Contexto do Projeto e da Copy:\n\n${fullContext}\n\nGere o system prompt:` }
        ],
        max_completion_tokens: 1200,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();

    // ✅ Log detalhado da resposta
    console.log('📦 AI Response Status:', aiResponse.status);
    console.log('📦 AI Response Keys:', Object.keys(aiData));
    console.log('📦 AI Choices Length:', aiData.choices?.length);

    // Tentar extrair content de diferentes estruturas possíveis
    let generatedSystemPrompt = 
      aiData.choices?.[0]?.message?.content ||
      aiData.choices?.[0]?.text ||
      aiData.content ||
      null;

    // Validação robusta com fallback
    if (!generatedSystemPrompt || !generatedSystemPrompt.trim()) {
      if (aiData.error) {
        console.error('❌ API Error:', aiData.error);
      }
      console.warn('⚠️ Empty AI response. Using fallback system prompt.');
      generatedSystemPrompt = buildFallbackSystemPrompt(fullContext);
    }

    if (generatedSystemPrompt.trim().length < 100) {
      console.warn('⚠️ System prompt is too short. Using fallback system prompt.');
      generatedSystemPrompt = buildFallbackSystemPrompt(fullContext);
    }

    console.log('✅ System prompt generated successfully:', generatedSystemPrompt.length, 'characters');

    console.log('✅ System prompt generated successfully');

    // Salvar system prompt no banco (copies table) antes de retornar
    if (copyId && supabaseUrl && supabaseKey) {
      console.log('💾 Salvando system prompt no banco...');
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      
      const { error: updateError } = await supabaseAdmin
        .from('copies')
        .update({ 
          generated_system_prompt: generatedSystemPrompt,
          system_prompt_context_hash: contextHash,
          system_prompt_generated_at: new Date().toISOString(),
          system_prompt_model: 'openai/gpt-5-mini'
        })
        .eq('id', copyId);
      
      if (updateError) {
        console.error('❌ Erro ao salvar system prompt no banco:', updateError);
      } else {
        console.log('✓ System prompt salvo no banco (copy_id:', copyId, ')');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        systemPrompt: generatedSystemPrompt,
        contextHash,
        model: 'openai/gpt-5-mini',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-system-prompt:', error);
    
    // Detectar erros de autenticação e retornar 401
    const isAuthError = error instanceof Error && 
      (error.message.includes('Unauthorized') || 
       error.message.includes('Missing authorization'));
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallback: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isAuthError ? 401 : 500 
      }
    );
  }
});
