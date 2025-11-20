import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Session {
  id: string;
  name: string;
  blocks: Block[];
}

interface Block {
  id: string;
  type: string;
  content: string;
  order: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente admin com service role
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Configuração do backend ausente');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      copyId,
      copyTitle,
      copyType,
      sessions,
      userInstruction,
      previousCode,
      conversationHistory,
      workspaceId,
      userId,
    } = await req.json();

    if (!copyId || !sessions || !workspaceId || !userId) {
      throw new Error('Dados inválidos: copyId, sessions, workspaceId e userId são obrigatórios');
    }

    // Verificar créditos
    const { data: creditCheck, error: creditError } = await supabaseAdmin
      .rpc('check_workspace_credits', {
        p_workspace_id: workspaceId,
        estimated_tokens: 5000,
        p_model_name: 'google/gemini-2.5-flash'
      });

    if (creditError || !creditCheck?.has_sufficient_credits) {
      return new Response(
        JSON.stringify({ error: 'insufficient_credits' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir contexto da copy
    const copyContext = buildCopyContext(copyTitle, copyType, sessions);

    // Construir prompt do sistema
    const systemPrompt = buildSystemPrompt(copyContext, previousCode);

    // Construir histórico de conversa
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userInstruction }
    ];

    console.log('=== GERAÇÃO INICIADA ===');
    console.log('Modo:', previousCode?.html ? 'EDITAR' : 'CRIAR NOVO');
    console.log('Instrução do usuário:', userInstruction.substring(0, 100));
    console.log('Tem código anterior:', !!previousCode?.html);

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'AI configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `AI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    let aiResponse = aiData.choices[0].message.content;

    console.log('=== RESPOSTA DA IA ===');
    console.log('Tamanho da resposta:', aiResponse?.length || 0);
    console.log('Tipo de resposta:', 
      aiResponse.includes('```html') && aiResponse.includes('```css') ? 'CÓDIGO COMPLETO' :
      aiResponse.includes('```html') ? 'APENAS HTML' :
      'TEXTO PURO'
    );
    console.log('Preview:', aiResponse?.substring(0, 200) || 'empty');

    // Extrair HTML e CSS da resposta
    let { html, css, message } = extractCode(aiResponse);
    let retryCount = 0;
    const MAX_RETRIES = 2;

    // Se resposta inválida, tentar novamente com prompt corretivo
    while ((!html || html.trim() === '') && retryCount < MAX_RETRIES) {
      retryCount++;
      console.warn(`Resposta inválida (tentativa ${retryCount}/${MAX_RETRIES}). Tentando novamente...`);
      
      const retryMessages = [
        ...messages,
        { 
          role: 'assistant', 
          content: aiResponse 
        },
        { 
          role: 'user', 
          content: `ERRO: Você não retornou os blocos de código. Retorne AGORA exatamente dois blocos: \`\`\`html e \`\`\`css. NÃO escreva explicações.` 
        }
      ];
      
      const retryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: retryMessages,
          max_completion_tokens: 4000,
        }),
      });
      
      if (!retryResponse.ok) {
        console.error('Retry failed:', retryResponse.status);
        break;
      }
      
      const retryData = await retryResponse.json();
      aiResponse = retryData.choices[0].message.content;
      const extracted = extractCode(aiResponse);
      html = extracted.html;
      css = extracted.css;
      message = extracted.message;
    }

    console.log('=== EXTRAÇÃO ===');
    console.log('HTML extraído:', html ? `${html.length} chars` : 'NENHUM');
    console.log('CSS extraído:', css ? `${css.length} chars` : 'NENHUM');
    console.log('Retry count:', retryCount);
    
    // Validar se HTML foi extraído (após retries)
    if (!html || html.trim() === '') {
      console.error('IA falhou mesmo após retries. Modo:', previousCode?.html ? 'EDIT' : 'CREATE');
      console.error('Última resposta da IA:', aiResponse?.substring(0, 500));
      return new Response(
        JSON.stringify({ 
          error: 'AI_GENERATION_FAILED', 
          details: 'Modelo não retornou código válido após múltiplas tentativas'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CSS é opcional - aplicar fallback se ausente
    let finalCss = css?.trim() || '';
    if (!finalCss) {
      console.warn('IA não retornou CSS. Aplicando CSS base padrão.');
      finalCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #fff;
}

h1, h2, h3, h4, h5, h6 {
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.2;
}

p {
  margin-bottom: 1rem;
}

section {
  padding: 3rem 1.5rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

button, .btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
}`;
    }

    // Debitar créditos
    const usage = aiData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Criar registro de geração
    const { data: generation } = await supabaseAdmin
      .from('ai_generation_history')
      .insert({
        copy_id: copyId,
        workspace_id: workspaceId,
        created_by: userId,
        generation_type: 'web_page',
        model_used: 'google/gemini-2.5-flash',
        generation_category: 'web_page',
        prompt: userInstruction,
        sessions: { html, css: finalCss },
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        system_instruction: { system_prompt: systemPrompt },
      })
      .select()
      .single();

    // Debitar créditos
    if (generation) {
      await supabaseAdmin.rpc('debit_workspace_credits', {
        p_workspace_id: workspaceId,
        p_model_name: 'google/gemini-2.5-flash',
        tokens_used: usage.total_tokens,
        p_input_tokens: usage.prompt_tokens,
        p_output_tokens: usage.completion_tokens,
        generation_id: generation.id,
        p_user_id: userId,
      });
    }

    return new Response(
      JSON.stringify({ html, css: finalCss, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-web-page:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildCopyContext(title: string, type: string | null, sessions: Session[]): string {
  let context = `# ${title}\n\nTipo: ${type || 'Landing Page'}\n\n`;
  
  sessions.forEach((session) => {
    context += `## ${session.name}\n\n`;
    session.blocks.forEach((block) => {
      context += `**${block.type}**: ${block.content}\n\n`;
    });
  });
  
  return context;
}

function buildSystemPrompt(copyContext: string, previousCode: any): string {
  let prompt = `⚠️ REGRA ABSOLUTA - LEIA COM ATENÇÃO:
- Você NUNCA deve fazer perguntas ou retornar texto explicativo
- Você SEMPRE deve retornar exatamente DOIS blocos de código: \`\`\`html e \`\`\`css
- Se a instrução for ambígua ou incompleta, faça a MELHOR INTERPRETAÇÃO POSSÍVEL e execute
- Você é um EXECUTOR DE CÓDIGO, não um assistente conversacional
- NUNCA responda com frases como "preciso de mais informações" ou "por favor especifique"
- PROIBIDO adicionar qualquer texto fora dos dois blocos de código

⚠️ EXEMPLO DE RESPOSTA VÁLIDA:

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Exemplo</title>
</head>
<body>
    <h1>Título</h1>
</body>
</html>
\`\`\`

\`\`\`css
* { margin: 0; padding: 0; }
body { font-family: Arial; }
h1 { color: blue; }
\`\`\`

⚠️ PROIBIDO:
❌ "Página gerada com sucesso!" (NÃO retornar apenas texto)
❌ Retornar apenas HTML sem CSS
❌ Fazer perguntas

Você é um especialista em desenvolvimento web. Crie landing pages modernas, responsivas e otimizadas para conversão.

CONTEXTO DA COPY:
${copyContext}

OBJETIVO:
Gerar código HTML5 e CSS3 puro, profissional e funcional.

REQUISITOS ESSENCIAIS:

1. **Hero Section**: Headline impactante, CTA destacado, imagem/visual atraente
2. **Layout Responsivo**: Mobile-first, funciona perfeitamente em todos os dispositivos
3. **Tipografia**: Google Fonts, hierarquia clara (H1: 48-64px, H2: 36-48px, Body: 16-18px)
4. **Cores**: Paleta harmoniosa (primária, secundária, ação, neutras)
5. **Espaçamento**: Seções bem espaçadas (80-120px padding vertical)
6. **CTAs**: Botões com alto contraste, textos orientados à ação
7. **Elementos Visuais**: 
   - Placeholders: https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=DESCRIPTION
   - Ícones: Font Awesome via CDN
8. **Acessibilidade**: Semântica HTML5, alt texts, contraste adequado

⚠️ FORMATO DE RESPOSTA - SEM EXCEÇÕES:

Sua resposta DEVE conter EXATAMENTE isto e NADA MAIS:

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Título da Página</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- HTML completo aqui -->
</body>
</html>
\`\`\`

\`\`\`css
/* CSS completo aqui */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Poppins', sans-serif; line-height: 1.6; }
/* ... resto do CSS */
\`\`\`

REGRAS:
- Apenas HTML5 e CSS3 puro (sem frameworks como Bootstrap ou Tailwind)
- CSS em arquivo separado, sem inline styles
- Código limpo, organizado e bem comentado
- Totalmente funcional e pronto para uso

LEMBRE-SE: Sua resposta DEVE começar com \`\`\`html e depois \`\`\`css. Nada mais.`;

  if (previousCode?.html) {
    prompt += `\n\n📝 MODO DE EDIÇÃO:

CÓDIGO ATUAL:
\`\`\`html
${previousCode.html}
\`\`\`

\`\`\`css
${previousCode.css}
\`\`\`

INSTRUÇÕES DE EDIÇÃO:
1. Pegue o código HTML e CSS acima
2. Aplique a modificação solicitada pelo usuário
3. Retorne o código COMPLETO modificado (não apenas a parte alterada)
4. NUNCA peça esclarecimentos - execute baseado na melhor interpretação

EXEMPLOS DE INTERPRETAÇÃO:
- "Mude a cor do texto" → aplicar color: [cor] em todos os elementos de texto (p, h1, h2, etc)
- "Deixe mais moderno" → adicionar gradientes, sombras, bordas arredondadas, animações sutis
- "Adicione um botão" → adicionar onde fizer mais sentido contextualmente (ex: após CTA)
- "Mude cores para azul" → aplicar tons de azul como cor primária em toda a paleta
- "Aumente o título" → aumentar font-size do h1 principal em 20-30%
- "Adicione sombras" → aplicar box-shadow em cards, botões e seções principais

ATENÇÃO: Mesmo que a modificação seja pequena (mudar cor, adicionar botão, etc), 
você DEVE retornar TODO o código HTML e TODO o código CSS.
NUNCA retorne apenas uma explicação ou confirmação.`;
  }

  return prompt;
}

function extractCode(aiResponse: string): { html: string; css: string; message: string } {
  let message = 'Página gerada com sucesso!';
  let html = '';
  let css = '';

  if (!aiResponse) {
    console.error('extractCode: aiResponse is empty or undefined');
    return { html, css, message };
  }

  // Try to extract message if present
  const messageMatch = aiResponse.match(/MENSAGEM:\s*\n([\s\S]*?)(?=HTML:|CSS:|```|$)/);
  if (messageMatch) {
    message = messageMatch[1].trim();
  }

  // Extract HTML - try multiple patterns
  // Pattern 1: ```html ... ``` (most common)
  let htmlMatch = aiResponse.match(/```html\s*\n([\s\S]*?)```/);
  if (htmlMatch) {
    html = htmlMatch[1].trim();
  }
  
  // Pattern 2: Any code block starting with <!DOCTYPE
  if (!html) {
    htmlMatch = aiResponse.match(/```(?:html)?\s*\n?(<!DOCTYPE[\s\S]*?)```/);
    if (htmlMatch) {
      html = htmlMatch[1].trim();
    }
  }

  // Pattern 3: Find <!DOCTYPE without code block
  if (!html) {
    htmlMatch = aiResponse.match(/(<!DOCTYPE html>[\s\S]*?<\/html>)/);
    if (htmlMatch) {
      html = htmlMatch[1].trim();
    }
  }

  // Extract CSS - try multiple patterns with flexible whitespace
  // Pattern 1: ```css ... ``` (most flexible - matches any whitespace including newlines)
  let cssMatch = aiResponse.match(/```css\s*([\s\S]*?)```/);
  if (cssMatch) {
    css = cssMatch[1].trim();
  }

  // Pattern 2: Look for CSS after HTML block
  if (!css) {
    const afterHtml = aiResponse.split('```html')[1];
    if (afterHtml) {
      cssMatch = afterHtml.match(/```css\s*([\s\S]*?)```/);
      if (cssMatch) {
        css = cssMatch[1].trim();
      }
    }
  }

  // Pattern 3: Find any code block with CSS selectors (as fallback)
  if (!css) {
    cssMatch = aiResponse.match(/```(?:css)?\s*\n?([^`]*?{[^`]*?}[^`]*?)```/);
    if (cssMatch) {
      css = cssMatch[1].trim();
    }
  }

  // Pattern 4: Find <style> tag content (last resort)
  if (!css) {
    cssMatch = aiResponse.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (cssMatch) {
      css = cssMatch[1].trim();
    }
  }

  console.log('extractCode results:', {
    foundMessage: !!message,
    htmlLength: html.length,
    cssLength: css.length,
    htmlPreview: html.substring(0, 100),
    cssPreview: css.substring(0, 100)
  });

  return { html, css, message };
}
