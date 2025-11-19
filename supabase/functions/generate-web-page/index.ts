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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const {
      copyId,
      copyTitle,
      copyType,
      sessions,
      userInstruction,
      previousCode,
      conversationHistory,
    } = await req.json();

    if (!copyId || !sessions) {
      throw new Error('Dados inválidos');
    }

    // Buscar workspace do usuário
    const { data: workspaceMember } = await supabaseClient
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single();

    if (!workspaceMember) {
      throw new Error('Workspace não encontrado');
    }

    // Verificar créditos
    const { data: creditCheck, error: creditError } = await supabaseClient
      .rpc('check_workspace_credits', {
        p_workspace_id: workspaceMember.workspace_id,
        estimated_tokens: 3000,
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

    // Chamar Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    // Extrair HTML e CSS da resposta
    const { html, css, message } = extractCode(aiResponse);

    // Debitar créditos
    const usage = aiData.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Criar registro de geração
    const { data: generation } = await supabaseClient
      .from('ai_generation_history')
      .insert({
        copy_id: copyId,
        workspace_id: workspaceMember.workspace_id,
        created_by: user.id,
        generation_type: 'web_page',
        model_used: 'google/gemini-2.5-flash',
        prompt: userInstruction,
        sessions: { html, css },
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      })
      .select()
      .single();

    if (generation) {
      await supabaseClient.rpc('debit_workspace_credits', {
        p_workspace_id: workspaceMember.workspace_id,
        p_model_name: 'google/gemini-2.5-flash',
        tokens_used: usage.total_tokens,
        p_input_tokens: usage.prompt_tokens,
        p_output_tokens: usage.completion_tokens,
        generation_id: generation.id,
        p_user_id: user.id,
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
  let prompt = `Você é um especialista em desenvolvimento web focado em criar landing pages HTML/CSS de alta conversão.

CONTEXTO DA COPY:
${copyContext}

SUAS RESPONSABILIDADES:
1. Criar código HTML semântico e CSS moderno
2. Garantir design responsivo (mobile-first)
3. Usar as cores e estilos apropriados para o tipo de negócio
4. Manter hierarquia visual clara
5. Adicionar animações suaves quando apropriado
6. Otimizar para conversão (CTAs destacados, prova social, etc)

ESTRUTURA DE RESPOSTA:
Sempre retorne sua resposta neste formato EXATO:

MENSAGEM:
[Sua explicação sobre o que foi feito]

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

  if (previousCode) {
    prompt += `\n\nCÓDIGO ANTERIOR:
HTML:
${previousCode.html}

CSS:
${previousCode.css}

Faça as modificações solicitadas mantendo o que já está bom.`;
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
