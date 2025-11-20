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
        p_model_name: 'openai/gpt-5'
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
        model: 'openai/gpt-5',
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

    // Extrair HTML e CSS da resposta
    const { html, css, message } = extractCode(aiResponse);
    
    // Validar se HTML e CSS foram extraídos
    if (!html || !css || html.trim() === '' || css.trim() === '') {
      console.error('IA não retornou HTML/CSS válido:', aiResponse.substring(0, 500));
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
        model_used: 'openai/gpt-5',
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
        p_model_name: 'openai/gpt-5',
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
  let prompt = `Você é um especialista em desenvolvimento web focado em criar landing pages modernas e de alta conversão.

CONTEXTO DA COPY:
${copyContext}

SUA RESPONSABILIDADE:
Gerar código HTML e CSS profissional, responsivo e otimizado para conversão de visitantes em leads/clientes.

DIRETRIZES DE DESIGN OBRIGATÓRIAS:

1. **Hero Section Impactante**:
   - Headline clara e persuasiva
   - Subheadline complementar
   - CTA principal destacado
   - Imagem/visual de impacto
   - Valor único evidente

2. **Estrutura de Conversão**:
   - Above the fold otimizado
   - Hierarquia visual clara
   - Flow de leitura natural (Z-pattern ou F-pattern)
   - CTAs estrategicamente posicionados
   - Seções com propósito definido

3. **Design Responsivo Mobile-First**:
   - Adaptação fluida para mobile, tablet e desktop
   - Touch-friendly (botões > 44px)
   - Imagens otimizadas para cada viewport
   - Tipografia escalável

4. **Tipografia Profissional**:
   - Google Fonts (Poppins, Inter, Montserrat, etc.)
   - Hierarquia: H1 (48-64px) > H2 (36-48px) > H3 (24-32px) > Body (16-18px)
   - Line-height: 1.5-1.8 para legibilidade
   - Contraste adequado (WCAG AA mínimo)

5. **Paleta de Cores Harmoniosa**:
   - Cor primária (brand)
   - Cor secundária (complementar)
   - Cor de ação (CTAs)
   - Cores neutras (backgrounds, textos)
   - Máximo 4-5 cores principais

6. **Espaçamentos e Layout**:
   - Breathing room generoso (padding: 80-120px vertical nas seções)
   - Grid system consistente
   - Container max-width: 1200-1400px
   - Margens laterais adequadas

7. **CTAs Estratégicos**:
   - Botões com contraste forte
   - Textos orientados à ação ("Comece Agora", "Garantir Minha Vaga")
   - Hover states atrativos
   - Múltiplos CTAs ao longo da página

8. **Elementos de Conversão**:
   - Provas sociais (depoimentos, logos, números)
   - Benefícios claros (features → benefits)
   - Urgência/escassez quando apropriado
   - Garantias e eliminação de objeções
   - Formulários simples e otimizados

9. **Recursos Visuais**:
   - Use placeholders descritivos: https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=DESCRIPTION
   - Ícones: Font Awesome ou Heroicons via CDN
   - Imagens de alta qualidade (sugeridas via placeholders)

10. **Performance e Acessibilidade**:
    - Semântica HTML5 correta (<header>, <main>, <section>, <article>)
    - Alt text descritivos em imagens
    - Contrast ratio adequado
    - CSS otimizado e organizado

ESTRUTURA DE RESPOSTA:
Sempre retorne sua resposta neste formato EXATO:

MENSAGEM:
[Breve explicação do que foi criado/modificado]

HTML:
\`\`\`html
[código HTML completo]
\`\`\`

CSS:
\`\`\`css
[código CSS completo]
\`\`\`

REGRAS IMPORTANTES:
- Use apenas HTML5 e CSS3 puro (sem frameworks)
- CSS inline não é permitido, use classes
- Seja criativo mas profissional
- Priorize legibilidade e manutenibilidade`;

  if (previousCode?.html) {
    prompt += `\n\nCÓDIGO ANTERIOR:
HTML:
${previousCode.html}

CSS:
${previousCode.css}

Faça as modificações solicitadas mantendo o que já está bom e melhorando onde necessário.`;
  }

  return prompt;
}

function extractCode(aiResponse: string): { html: string; css: string; message: string } {
  let message = '';
  let html = '';
  let css = '';

  // Extrair mensagem
  const messageMatch = aiResponse.match(/MENSAGEM:\s*\n([\s\S]*?)(?=HTML:|CSS:|$)/);
  if (messageMatch) {
    message = messageMatch[1].trim();
  }

  // Extrair HTML
  const htmlMatch = aiResponse.match(/```html\s*\n([\s\S]*?)\n```/);
  if (htmlMatch) {
    html = htmlMatch[1].trim();
  }

  // Extrair CSS
  const cssMatch = aiResponse.match(/```css\s*\n([\s\S]*?)\n```/);
  if (cssMatch) {
    css = cssMatch[1].trim();
  }

  // Fallback: se não encontrou no formato esperado, tentar extrair de qualquer código
  if (!html) {
    const anyHtmlMatch = aiResponse.match(/```(?:html)?\s*\n(<!DOCTYPE html>[\s\S]*?)\n```/);
    if (anyHtmlMatch) {
      html = anyHtmlMatch[1].trim();
    }
  }

  if (!css) {
    const anyCssMatch = aiResponse.match(/```(?:css)?\s*\n([^`]*?{[^`]*?}[^`]*?)\n```/);
    if (anyCssMatch) {
      css = anyCssMatch[1].trim();
    }
  }

  if (!message) {
    message = 'Página gerada com sucesso!';
  }

  return { html, css, message };
}
