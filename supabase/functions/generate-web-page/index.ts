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

    // Chamar Lovable AI com GPT-5
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
    const aiResponse = aiData.choices[0].message.content;

    console.log('AI Response length:', aiResponse?.length || 0);
    console.log('AI Response preview:', aiResponse?.substring(0, 200));

    // Extrair HTML e CSS da resposta
    const { html, css, message } = extractCode(aiResponse);
    
    console.log('Extracted HTML length:', html?.length || 0);
    console.log('Extracted CSS length:', css?.length || 0);
    
    // Validar se HTML e CSS foram extraídos
    if (!html || !css || html.trim() === '' || css.trim() === '') {
      console.error('IA não retornou HTML/CSS válido. Full response:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'AI did not return valid HTML/CSS. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        sessions: { html, css },
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
      JSON.stringify({ html, css, message }),
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
  let prompt = `Você é um especialista em desenvolvimento web. Crie landing pages modernas, responsivas e otimizadas para conversão.

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

ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
Retorne APENAS os blocos de código, sem explicações adicionais fora dos blocos:

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Título da Página</title>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <!-- Seu código HTML completo aqui -->
</body>
</html>
\`\`\`

\`\`\`css
/* Seu código CSS completo aqui */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Poppins', sans-serif;
    line-height: 1.6;
}
/* ... resto do CSS */
\`\`\`

REGRAS:
- Apenas HTML5 e CSS3 puro (sem frameworks como Bootstrap ou Tailwind)
- CSS em arquivo separado, sem inline styles
- Código limpo, organizado e bem comentado
- Totalmente funcional e pronto para uso`;

  if (previousCode?.html) {
    prompt += `\n\nCÓDIGO ANTERIOR PARA EDIÇÃO:
\`\`\`html
${previousCode.html}
\`\`\`

\`\`\`css
${previousCode.css}
\`\`\`

Mantenha o que está bom e aplique as modificações solicitadas pelo usuário.`;
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
