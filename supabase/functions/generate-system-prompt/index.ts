import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { buildProjectPrompt, extractProjectIdentity, extractProjectMethodology } from '../_shared/promptProjectBuilder.ts';
import { buildCopyPrompt, generateContextHash } from '../_shared/promptCopyBuilder.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompt Instruction para o GPT-4 (será substituído pelo prompt real fornecido pelo usuário)
const PROMPT_INSTRUCTION = `Você é um especialista em criar system prompts para copywriters de IA.

Sua tarefa é analisar o contexto do projeto e da copy fornecidos e gerar um system prompt claro, 
estruturado e efetivo que será usado para instruir um modelo de IA a gerar a copy.

O system prompt deve:
1. Definir claramente a identidade e papel do agente de IA
2. Incorporar a metodologia do projeto (se fornecida)
3. Estabelecer o tom de voz e personalidade baseado na identidade da marca
4. Incluir diretrizes específicas baseadas no tipo de copy
5. Mencionar o público-alvo e oferta (se fornecidos)
6. Incluir objetivos, estilos e foco emocional (se fornecidos)
7. Estabelecer regras de estruturação do output (sessões e blocos)

Gere um system prompt profissional, conciso e acionável.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { projectId, copyContext } = await req.json();

    if (!projectId) {
      throw new Error('projectId is required');
    }

    console.log('📋 Generating system prompt for project:', projectId);

    // Buscar dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw new Error('Failed to fetch project data');
    }

    // Construir prompt_Projeto
    const projectIdentity = extractProjectIdentity(project);
    const projectMethodology = extractProjectMethodology(project);
    const projectPrompt = buildProjectPrompt(projectIdentity, projectMethodology);

    console.log('📦 Project prompt built:', projectPrompt ? 'Yes' : 'Empty');

    // Construir prompt_Copy
    const copyPrompt = buildCopyPrompt(copyContext);
    console.log('📝 Copy prompt built:', copyPrompt ? 'Yes' : 'Empty');

    // Gerar hash do contexto
    const contextHash = generateContextHash(projectPrompt, copyPrompt);
    console.log('🔑 Context hash generated:', contextHash);

    // Combinar prompts
    const fullContext = [projectPrompt, copyPrompt].filter(p => p).join('\n\n---\n\n');

    if (!fullContext.trim()) {
      throw new Error('No context available to generate system prompt');
    }

    // Chamar GPT-4 mini via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
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
        max_completion_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedSystemPrompt = aiData.choices?.[0]?.message?.content;

    if (!generatedSystemPrompt) {
      throw new Error('No system prompt generated from AI');
    }

    console.log('✅ System prompt generated successfully');

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
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallback: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
