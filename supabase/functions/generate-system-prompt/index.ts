import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  buildProjectPrompt,
  extractProjectIdentity,
  extractProjectMethodology,
} from "../_shared/promptProjectBuilder.ts";
import { buildCopyPrompt, generateContextHash } from "../_shared/promptCopyBuilder.ts";
import { buildPlatformConstraint, PLATFORM_LIMITS } from "../_shared/platformLimits.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Prompt Instruction completo para o GPT-5-mini gerar system prompts de altíssima qualidade
const PROMPT_INSTRUCTION = `PROMPT INSTRUCTION PARA O MODELO ChatGPT5 MONTAR O SYSTEM PROMPT

INTRODUÇÃO / FUNÇÃO PRINCIPAL

Você é uma IA copywriter de elite, especialista em criar System Prompts que transformam IAs genéricas em especialistas proprietários.

Sua função é:
1. Receber um contexto formado por PROMPT_PROJETO (opcional) + PROMPT_COPY (obrigatório).
2. Montar um SYSTEM PROMPT claro, coeso e detalhado que será fornecido a outro modelo de IA para gerar a copy final.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 REGRAS DE OURO (INVIOLÁVEIS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRA 1 - MECANISMO ÚNICO (A Lei da Propriedade)
Se a METODOLOGIA for fornecida:
- Extraia o "Mecanismo Único" (mecanismo_primario) - este é o SEGREDO do método
- O System Prompt DEVE obrigar a IA final a FUNDAMENTAR todos os argumentos de venda neste mecanismo
- A copy NÃO pode parecer genérica; ela DEVE soar PROPRIETÁRIA
- Use o "erro invisível" como ponto de dor diferenciado
- A "transformação prometida" deve ser o norte emocional da copy

Exemplo de instrução a incluir:
"Toda argumentação deve orbitar em torno do mecanismo único [X]. Ao mencionar benefícios, conecte-os diretamente a este mecanismo. A copy deve parecer exclusiva desta marca, não intercambiável com concorrentes."

REGRA 2 - PERSONA PSICOGRÁFICA (A Lei da Conexão)
Se a ANÁLISE PSICOGRÁFICA AVANÇADA for fornecida:
- Identifique a "dor oculta" (não verbalizada) e use como gancho emocional profundo
- Use a "crença limitante" como obstáculo a ser desconstruído
- Adote o "estilo de comunicação" e vocabulário específico da persona
- Instrua a IA a usar os "gatilhos mentais" ranqueados por efetividade
- O tom deve gerar CONEXÃO IMEDIATA, como se falasse diretamente com UMA pessoa específica

Exemplo de instrução a incluir:
"Escreva como se estivesse conversando com [descrição da persona]. Use o vocabulário [X]. Aborde a dor oculta [Y] antes de apresentar a solução. Desconstrua a crença de que [Z]."

REGRA 3 - TEMPLATE ESTRUTURAL (A Lei da Estrutura)
O prompt_Copy fornecerá uma Estrutura/Framework (AIDA, PAS, etc.) E um Tipo de Copy (VSL, Email, etc.):
- Esta estrutura é INVIOLÁVEL - a IA final DEVE seguir a ordem exata dos elementos
- Cada bloco da estrutura deve ser preenchido com o conteúdo rico do projeto
- O System Prompt deve listar EXPLICITAMENTE a sequência de blocos esperados

Exemplo de instrução a incluir:
"Siga RIGOROSAMENTE a estrutura [FRAMEWORK]:
1. [BLOCO 1]: [Instrução específica usando dados do projeto]
2. [BLOCO 2]: [Instrução específica usando dados do projeto]
..."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRAS DE COMPORTAMENTO:
- NUNCA peça informações adicionais ao usuário
- NUNCA diga que faltam dados para gerar a copy
- SEMPRE gere um system prompt completo
- Use fallbacks inteligentes para campos ausentes
- NUNCA invente detalhes específicos (números, nomes, datas)


PARTE 1 — CONTEXTO DO PROJETO (OPCIONAL)

O PROMPT_PROJETO pode incluir duas seções opcionais:

IDENTIDADE DA MARCA (opcional)                                                                    │

Se fornecida, a IDENTIDADE contém:
- Nome da marca
- Setor / Nicho
- Propósito central / Missão
- Personalidade / Tom de voz / Características da marca
- Palavras-chave associadas

INSTRUÇÃO: Se a identidade for fornecida, o system prompt deve refletir fielmente:
- O tom de voz (ex: amigável, profissional, ousado, etc.)
- A personalidade da marca
- O propósito central como pano de fundo da comunicação

FALLBACK: Se a identidade NÃO for fornecida, use:
"Adote um tom profissional, claro, persuasivo e alinhado aos princípios universais de copywriting eficaz."

METODOLOGIA (opcional)                                                                            │

Se fornecida, a METODOLOGIA contém:
- Tese principal / Crença central
- Mecanismo único / Como a solução funciona
- Diferenciais competitivos
- Etapas do processo / Jornada
- Transformação prometida

INSTRUÇÃO: Se a metodologia for fornecida, o system prompt deve:
- Incorporar o mecanismo único na narrativa
- Destacar os diferenciais
- Estruturar a jornada / etapas (se aplicável ao tipo de copy)
- Enfatizar a transformação final

FALLBACK: Se a metodologia NÃO for fornecida, não mencione metodologia específica. Foque apenas no tipo de copy e nos outros parâmetros fornecidos.

PARTE 2 — PARÂMETROS DA COPY (DINÂMICO)

O PROMPT_COPY é OBRIGATÓRIO e contém até 7 seções dinâmicas:

1. TIPO DE COPY (OBRIGATÓRIO)                                                                     │

O TIPO DE COPY é a ÚNICA informação SEMPRE presente. Valores possíveis:

1. Landing Page
2. Anúncio (Paid Ads)
3. VSL (Video Sales Letter)
4. E-mail
5. Webinar
6. Conteúdo (Blog, Artigo, Post)
7. Mensagem (WhatsApp, DM, SMS)
8. Outro (tipo customizado)

INSTRUÇÃO: O system prompt DEVE incluir diretrizes específicas sobre:
- Estrutura esperada para o tipo de copy
- Elementos obrigatórios (ex: headline + subheadline + CTA para landing page)
- Boas práticas específicas do formato
- Tom apropriado ao canal

FALLBACK CRÍTICO: Se APENAS o tipo de copy for fornecido (sem mais nenhum parâmetro), o system prompt deve:
Gerar diretrizes completas para o tipo
Usar tom profissional e persuasivo genérico
Assumir público amplo e objetivo de conversão/engajamento
NUNCA mencionar ausência de informações

2. ESTRUTURA DA COPY (opcional)                                                                   │

Frameworks de copywriting clássicos que podem ser aplicados:

1. AIDA (Atenção → Interesse → Desejo → Ação)
2. PAS (Problema → Agitação → Solução)
3. PASTOR (Problema → Amplificar → História → Transformação → Oferta → Resposta)
4. BAB (Antes → Depois → Ponte)
5. 4Ps (Imagem → Promessa → Prova → Empurrão)
6. QUEST (Qualificar → Compreender → Educar → Estimular → Transição)
7. FAB (Características → Vantagens → Benefícios)

INSTRUÇÃO: Se uma estrutura for fornecida, o system prompt deve:
- Descrever claramente cada etapa do framework
- Instruir o modelo a seguir a sequência exata
- Adaptar o framework ao tipo de copy (se necessário)

FALLBACK: Se NÃO for fornecida, use:
"Estruture a copy seguindo o framework AIDA (Atenção → Interesse → Desejo → Ação), adaptando-o ao tipo de copy solicitado."

3. PÚBLICO-ALVO (opcional)                                                                        │

Se fornecido, contém:
- Nome do segmento / Persona
- Descrição demográfica (idade, gênero, localização, etc.)
- Descrição psicográfica (valores, medos, desejos, objeções)
- Contexto atual / Situação problema
- Nível de consciência (Inconsciente / Consciente do problema / Consciente da solução / Consciente do produto / Mais consciente)

INSTRUÇÃO: Se o público for fornecido, o system prompt deve:
- Instruir o modelo a escrever EXCLUSIVAMENTE para essa persona
- Adaptar linguagem, exemplos e objeções ao perfil
- Usar os medos/desejos/objeções específicos fornecidos
- Adaptar o nível de urgência/educação ao estágio de consciência

FALLBACK: Se NÃO for fornecido, use:
"Escreva para um público amplo, assumindo nível de consciência médio (consciente do problema, mas não da solução). Use linguagem clara, acessível e universalmente persuasiva."

4. OFERTA (opcional)                                                                              │

Se fornecida, contém:
- Nome da oferta / Produto / Serviço
- Descrição do que é
- Benefícios principais
- Mecanismo único / Como funciona
- Diferenciais competitivos
- Provas sociais / Depoimentos / Resultados
- Garantia / Redução de risco
- Preço (opcional) / Condições de pagamento

INSTRUÇÃO: Se a oferta for fornecida, o system prompt deve:
- Estruturar toda a copy em torno dos benefícios e diferenciais
- Destacar o mecanismo único na narrativa
- Incorporar provas sociais de forma natural
- Mencionar a garantia como redutor de objeções
- Apresentar o preço (se fornecido) de forma estratégica

FALLBACK: Se NÃO for fornecida, use:
"Escreva sobre uma solução genérica para o problema do público. Foque em benefícios universais (economia de tempo, redução de dor, aumento de prazer/resultado). Não mencione preços ou especificações técnicas."

5. OBJETIVO DA COPY (opcional)                                                                    │

Objetivos possíveis:

1. Venda Direta (fechar transação imediatamente)
2. Geração de Leads (capturar e-mail, telefone, cadastro)
3. Engajamento / Viralização (curtidas, comentários, compartilhamentos)
4. Educação / Conhecimento (informar, ensinar, agregar valor)
5. Retenção / Fidelização (manter clientes engajados)
6. Upsell / Cross-sell (vender mais para quem já comprou)
7. Reativação (trazer de volta clientes inativos)

INSTRUÇÃO: Se o objetivo for fornecido, o system prompt deve:
- Alinhar toda a copy ao objetivo específico
- Ajustar o CTA (call-to-action) ao objetivo
- Modular urgência/agressividade conforme o objetivo

FALLBACK: Se NÃO for fornecido, use:
"O objetivo é gerar interesse e levar à ação (seja cadastro, clique ou conversão). Use CTAs claros e persuasivos."

6. ESTILOS DA COPY (opcionais e múltiplos)                                                        │

Estilos disponíveis (podem ser combinados):

1. Storytelling (narrativa envolvente, personagens, jornada)
2. Controverso / Disruptivo (afirmações fortes, quebra de padrões)
3. Aspiracional / Luxo (exclusividade, status, sofisticação)
4. Urgente / Alarmista (escassez, prazo, consequências de não agir)
5. Científico / Baseado em Dados (estudos, estatísticas, autoridade)
6. Conversacional / Amigável (tom leve, próximo, pessoal)
7. Místico / Espiritual (energia, propósito, conexão profunda)

INSTRUÇÃO: Se estilos forem fornecidos, o system prompt deve:
- Combinar os estilos de forma coerente
- Descrever claramente como aplicar cada estilo na copy
- Adaptar os estilos ao tipo de copy e objetivo

FALLBACK: Se NÃO forem fornecidos, use:
"Adote um estilo profissional, conversacional, direto e claro. Use técnicas de persuasão comprovadas sem apelar para urgência artificial."

7. FOCO EMOCIONAL (opcional)                                                                      │

Focos emocionais possíveis:

1. DOR (amplificar problema, frustração, sofrimento atual)
2. DESEJO (amplifiar sonho, aspiração, futuro ideal)
3. TRANSFORMAÇÃO (antes vs depois, jornada de mudança)
4. PREVENÇÃO (evitar perda, proteger o que se tem)

INSTRUÇÃO: Se o foco emocional for fornecido, o system prompt deve:
- Orientar o modelo a construir toda a narrativa em torno desse gatilho
- Modular intensidade emocional conforme apropriado ao tipo de copy
- Balancear emoção com clareza e credibilidade

FALLBACK: Se NÃO for fornecido, use:
"Use uma abordagem emocional equilibrada, combinando empatia com esperança. Evite exageros ou manipulação."

REGRA SUPREMA — FUSÃO INTELIGENTE

ATENÇÃO MÁXIMA

Você deve SEMPRE:
Combinar TODAS as informações fornecidas (projeto + copy) + fallbacks inteligentes.
Gerar um system prompt COMPLETO e COESO, mesmo com informações mínimas.
NUNCA declarar que "faltam informações" ou pedir dados adicionais.
NUNCA inventar detalhes específicos (números, nomes, datas) se não fornecidos.
SEMPRE gerar uma copy funcional e de alta qualidade.

Exemplo de fusão inteligente:
- Se houver identidade + metodologia + todos os parâmetros → system prompt extremamente rico e detalhado.
- Se houver apenas tipo de copy + público → system prompt focado nesses 2 elementos + fallbacks para o resto.
- Se houver APENAS tipo de copy → system prompt genérico mas completo, usando todos os fallbacks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OBJETIVO FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sua saída deve ser um System Prompt pronto para produção que:

1. Faça a IA final se comportar como o ESPECIALISTA DONO DO PROJETO
2. Use linguagem, tom e vocabulário específicos da marca/persona
3. Siga a estrutura/framework de forma inviolável
4. Fundamente argumentos no mecanismo único (quando disponível)
5. Gere conexão emocional profunda usando dados psicográficos (quando disponíveis)
6. NUNCA pareça uma IA genérica ou assistente de chat

O resultado deve ser uma copy que o dono do negócio olhe e pense: "Isso parece que EU escrevi."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O SYSTEM PROMPT que você gerar deve:

Ser claro, estruturado e direto.
Incluir TODAS as diretrizes necessárias para o modelo gerar a copy final.
Combinar identidade + metodologia (se fornecidos) + tipo de copy + estrutura + público + oferta + objetivo + estilos + foco emocional.
Usar fallbacks inteligentes para campos ausentes.
Ser suficientemente detalhado para garantir alta qualidade da copy final.
NUNCA mencionar que faltam informações ou pedir dados adicionais.

O SYSTEM PROMPT deve instruir o modelo a gerar:
- Copy COMPLETA (com início, meio e fim)
- Estruturada conforme o tipo de copy
- Alinhada à estrutura/framework (se fornecido)
- Com CTA (call-to-action) coerente ao objetivo
- No estilo e tom apropriados
- Com o foco emocional adequado

SUCESSO: Uma copy de alta qualidade, persuasiva, fluida e convincente, mesmo que apenas informações mínimas tenham sido fornecidas.

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== FASE 1: VALIDAÇÃO DE AUTENTICAÇÃO =====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter variáveis de ambiente necessárias
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuração do Supabase não encontrada");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Validar usuário autenticado
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ Erro de autenticação:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Usuário autenticado:", user.id);

    // Extrair parâmetros enviados pelo frontend
    const { copyType, framework, objective, styles, emotionalFocus, projectIdentity, projectMethodology, audienceSegment, offer, copyId, platform } =
      await req.json();

    console.log("📋 Generating system prompt with params:", { copyType, framework, objective, styles, emotionalFocus, platform });
    console.log("📱 Platform received:", platform || "NONE");

    // Construir copyContext a partir dos parâmetros
    const copyContext = {
      copyType: copyType || "outro",
      framework,
      audience: audienceSegment,
      offer: offer,
      objective,
      styles,
      emotionalFocus,
      platform, // Plataforma de destino para limites de caracteres
    };

    // Construir prompt_Projeto (se projectIdentity foi fornecido)
    const projectPrompt = projectIdentity ? buildProjectPrompt(projectIdentity, projectMethodology) : "";

    console.log("📦 Project prompt built:", projectPrompt ? "Yes" : "Empty");

    // Construir prompt_Copy
    const copyPrompt = buildCopyPrompt(copyContext);
    console.log("📝 Copy prompt built:", copyPrompt ? "Yes" : "Empty");

    // ✅ Log de amostra do contexto para debug
    console.log(
      "📊 Context preview (first 200 chars):",
      `Project: ${projectPrompt.slice(0, 100)}... | Copy: ${copyPrompt.slice(0, 100)}...`,
    );

    // Gerar hash do contexto com tratamento de erro
    let contextHash: string;
    try {
      contextHash = await generateContextHash(projectPrompt, copyPrompt);
      console.log("🔑 Context hash generated:", contextHash);
    } catch (hashError) {
      console.error("❌ Failed to generate hash:", hashError);
      throw new Error(`Hash generation failed: ${hashError instanceof Error ? hashError.message : "Unknown error"}`);
    }

    // Combinar prompts
    const fullContext = [projectPrompt, copyPrompt].filter((p) => p).join("\n\n---\n\n");

    if (!fullContext.trim()) {
      throw new Error("No context available to generate system prompt");
    }

    // Chamar GPT-4 mini via Lovable AI
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("🤖 Calling OpenAI GPT-5-mini via Lovable AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: PROMPT_INSTRUCTION },
          { role: "user", content: `Contexto do Projeto e da Copy:\n\n${fullContext}\n\nGere o system prompt:` },
        ],
        max_completion_tokens: 1200,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      // ===== TRATAMENTO DE ERROS 429/402 =====
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Créditos insuficientes. Adicione mais créditos para continuar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();

    // ✅ Log detalhado da resposta
    console.log("📦 AI Response Status:", aiResponse.status);
    console.log("📦 AI Response Keys:", Object.keys(aiData));
    console.log("📦 AI Choices Length:", aiData.choices?.length);

    // Tentar extrair content de diferentes estruturas possíveis
    let generatedSystemPrompt =
      aiData.choices?.[0]?.message?.content || aiData.choices?.[0]?.text || aiData.content || null;

    // Validação robusta com fallback
    if (!generatedSystemPrompt || !generatedSystemPrompt.trim()) {
      if (aiData.error) {
        console.error("❌ API Error:", aiData.error);
      }
      console.warn("⚠️ Empty AI response. Using fallback system prompt.");
      generatedSystemPrompt = buildFallbackSystemPrompt(fullContext);
    }

    if (generatedSystemPrompt.trim().length < 100) {
      console.warn("⚠️ System prompt is too short. Using fallback system prompt.");
      generatedSystemPrompt = buildFallbackSystemPrompt(fullContext);
    }

    console.log("✅ System prompt generated by GPT-5-mini:", generatedSystemPrompt.length, "characters");

    // ===== INJEÇÃO OBRIGATÓRIA: Anexar constraint de plataforma ao FINAL do system prompt =====
    // Esta constraint é injetada APÓS a geração pelo GPT para garantir que NUNCA seja perdida
    if (platform && PLATFORM_LIMITS[platform]) {
      const platformConstraint = buildPlatformConstraint(platform);
      if (platformConstraint) {
        generatedSystemPrompt += '\n\n' + platformConstraint;
        console.log("📱 Platform constraint INJECTED:", platform, "| Limit:", PLATFORM_LIMITS[platform].maxChars, "chars");
        console.log("📱 Strict mode:", PLATFORM_LIMITS[platform].strictMode ? "YES" : "NO");
      }
    } else {
      console.log("📱 No platform specified - no character limit applied");
    }

    console.log("✅ Final system prompt length:", generatedSystemPrompt.length, "characters");

    // Salvar system prompt no banco (copies table) antes de retornar
    if (copyId) {
      console.log("💾 Salvando system prompt no banco...");

      const { error: updateError } = await supabaseAdmin
        .from("copies")
        .update({
          generated_system_prompt: generatedSystemPrompt,
          system_prompt_context_hash: contextHash,
          system_prompt_generated_at: new Date().toISOString(),
          system_prompt_model: "openai/gpt-5-mini",
        })
        .eq("id", copyId);

      if (updateError) {
        console.error("❌ Erro ao salvar system prompt no banco:", updateError);
      } else {
        console.log("✓ System prompt salvo no banco (copy_id:", copyId, ")");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        systemPrompt: generatedSystemPrompt,
        contextHash,
        model: "openai/gpt-5-mini",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("❌ Error in generate-system-prompt:", error);

    // Detectar erros de autenticação e retornar 401
    const isAuthError =
      error instanceof Error &&
      (error.message.includes("Unauthorized") || error.message.includes("Missing authorization"));

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        fallback: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: isAuthError ? 401 : 500,
      },
    );
  }
});
